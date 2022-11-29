/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */

var BitrateRule;

function BitrateRuleClass() {

  let context = this.context;
  let factory = dashjs.FactoryMaker;
  let SwitchRequest = factory.getClassFactoryByName('SwitchRequest');
  let MetricsModel = factory.getSingletonFactoryByName('MetricsModel')(context).getInstance();
  let StreamController = factory.getSingletonFactoryByName('StreamController');
  let instance;

  // Gets called when the rule is created
  function setup() {
      console.log('Rule Created');
  }


  // This function gets called every time a segment is downloaded. Design your bitrate algorithm around that principle.
  function getMaxIndex(rulesContext) {
    // Constants. TOOD: Should probably be based on settings
    const bufferLimit = 8000;
    
    // Fetch metrics
    const mediaType = rulesContext.getMediaType();
    const metrics = MetricsModel.getMetricsFor(mediaType, true);

    // Get current bitrate
    const streamController = StreamController(context).getInstance();
    const abrController = rulesContext.getAbrController();
    const currentQuality = abrController.getQualityFor(mediaType, streamController.getActiveStreamInfo().id);
    const currentBitrate = rulesContext.getMediaInfo()['bitrateList'][currentQuality].bandwidth;
    const maxQuality = rulesContext.getMediaInfo()['bitrateList'].length - 1

    // Get throughput history
    const streamInfo = rulesContext.getStreamInfo();
    const streamId = streamInfo ? streamInfo.id : null;
    const isDynamic = streamInfo && streamInfo.manifestInfo ? streamInfo.manifestInfo.isDynamic : null;
    const throughputHistory = abrController.getThroughputHistory();
    const throughputKbps = throughputHistory.getSafeAverageThroughput(mediaType, isDynamic);
    const throughput = throughputKbps * 1000;

    // Get buffer level from the timestamp of the last chunk
    let bufferLevel = 0;
    if (metrics['BufferLevel'].length > 0) {
      bufferLevel = metrics['BufferLevel'][metrics['BufferLevel'].length - 1]['level'];
    }

    let newQuality = currentQuality;
    let switchReason = "";
    if (bufferLevel >= bufferLimit) {
      newQuality = Math.min(maxQuality, currentQuality + 1);
      switchReason = "Buffer high";
    } else if (bufferLevel < bufferLimit && throughput <= currentBitrate) {
      newQuality = Math.max(0, currentQuality - 1);
      switchReason = "Buffer low";
    }

    // let newQuality = 0;
    // let switchReason = "";
    // if (bufferLevel >= bufferLimit && throughput >= currentBitrate + 1) {
    //   newQuality = Math.min(maxQuality, currentQuality + 1);
    //   switchReason = "Buffer high";
    // } else if (bufferLevel < bufferLimit && throughput <= currentBitrate) {
    //   newQuality = 0; //Math.max(0, currentQuality - 1);
    //   switchReason = "Buffer low";
    // }

    console.log('bufferLevel', bufferLevel)
    // console.log('thoughput', throughput);
    // console.log('currentBitrate', currentBitrate);
    console.log(metrics);

    // If quality matches current bitrate, don't do anything
    if (currentQuality == newQuality) {
      console.log('Do nothing!');
      return SwitchRequest(context).create();
    }

    // Send quality switch request
    console.log("Switching quality");
    let switchRequest = SwitchRequest(context).create();
    switchRequest.quality = newQuality;
    switchRequest.reason = switchReason;
    switchRequest.priority = SwitchRequest.PRIORITY.STRONG;
    return switchRequest;
  }

  instance = {
      getMaxIndex: getMaxIndex
  };

  setup();

  return instance;
}

BitrateRuleClass.__dashjs_factory_name = 'BitrateRule';
BitrateRule = dashjs.FactoryMaker.getClassFactory(BitrateRuleClass);

