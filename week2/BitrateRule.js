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
        var mediaType = rulesContext.getMediaType();
        var metrics = MetricsModel.getMetricsFor(mediaType, true);

        // A smart bitrate rule could analyze playback metrics to take the
        // bitrate switching decision. Printing metrics here as a reference.
        // Go through them to see what you have available.
        console.log(metrics);
        
        // This example rule fetches the buffer length, and sets the quality to maximum if the buffer length is
        // more than 5 seconds and to minimum otherwise.
        // NOTE: This is not a very good rule. It is only shown for demonstrational purposes.
        let bufferLevel = 0;
        if (metrics['BufferLevel'].length > 0) {
            bufferLevel = metrics['BufferLevel'][metrics['BufferLevel'].length-1]['level'];
        }
    
        let quality = 0;
        let switchReason = "";
        if (bufferLevel > 5000) {
            quality = rulesContext.getMediaInfo()['bitrateList'].length-1;
            switchReason = "Buffer high";
        } else {
            quality = 0;
            switchReason = "Buffer low";
        }
    
        // Get current bitrate
        let streamController = StreamController(context).getInstance();
        let abrController = rulesContext.getAbrController();
        let current = abrController.getQualityFor(mediaType, streamController.getActiveStreamInfo().id);
        
        // If quality matches current bitrate, don't do anything
        if (current == quality) {
            console.log('Do nothing!');
            return SwitchRequest(context).create();
        }
    
        // Send quality switch request
        console.log("Switching quality");
        let switchRequest = SwitchRequest(context).create();
        switchRequest.quality = quality;
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

