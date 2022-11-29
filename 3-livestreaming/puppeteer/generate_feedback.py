import json
import matplotlib.pyplot as plt
import numpy as np
import io, base64
import sys

try:
   f_out = open('/server/www/feedback.html', 'w')
   filename = 'puppeteer_output.json'
   try:
      file = open('/puppeteer/'+filename,'r')
      #file = open(filename,'r')
      graph_json = json.loads(file.read())
      file.close()
   except:
      raise Exception('<pre>Opening the grading file failed</pre>')
   avail_bandwidths = np.array(graph_json['AvailableBandwidth'])
   req_bitrates = np.array(graph_json['RequestedBitrate'])
   buffer = np.array(graph_json['BufferLevel'])

   if req_bitrates.ndim == 2:
      fig, ax1 = plt.subplots()

      ax1.set_ylabel('Buffer Level (s)')
      ax1.set_xlabel('Playback time (s)')
      # Time as seconds, buffer value
      ln1 = ax1.plot(buffer[:,1],buffer[:,0], label='Buffer Level', color='g', linestyle='-', linewidth='0.7')
      plt.ylim(bottom=0)

      ax2 = ax1.twinx()

      # Time as seconds, bitrates as Mbps
      ln2 = ax2.plot(avail_bandwidths[:,1],avail_bandwidths[:,0]/1024/1024, label='Available Bandwidth', linestyle='-')
      ln3 = ax2.plot(req_bitrates[:,1],(req_bitrates[:,0])/1024/1024, label='Requested Bitrate', linestyle='-')
      ax2.set_ylabel('Bandwidth/Bitrate (Mbps)')

      ax = plt.gca()
      #ax.axes.xaxis.set_ticklabels([])

      lns = ln1+ln2+ln3
      labs = [l.get_label() for l in lns]
      ax.legend(lns, labs)
      ax1.autoscale(enable=True, axis='x', tight=True)
      ax2.autoscale(enable=True, axis='x', tight=True)
      plt.ylim(bottom=0)

      pic_IObytes = io.BytesIO()
      plt.savefig(pic_IObytes,  format='png')
      pic_IObytes.seek(0)
      base64_png = base64.b64encode(pic_IObytes.read())

      feedback = """
<div class="panel panel-default">
  <div class="panel-heading">
    <h4 class="panel-title">
      <a data-toggle="collapse" href="#plot-png-from-submitted">
        Image generated by the program</a>
      <span class="label feedback-label label-info">Info</span>
    </h4>
  </div>
  <div id="plot-png-from-submitted" class="panel-collapse collapse in">
    <div class="panel-body">
      <div class="well">
        <img src="data:image/png;base64,
        {0}
        " alt="Graphics" />
      </div>
    </div>
  </div>
</div>
""".format(base64_png.decode('utf-8'))
      print(feedback, file=f_out)

   print('<pre>', file=f_out)
   webrtc_brate = graph_json['WebRTCBitrate']
   webrtc_codec = graph_json['WebRTCCodec']
   print('Observed WebRTC bitrate of up to ', webrtc_brate, ' using codec: ' + webrtc_codec, file=f_out)
   if webrtc_brate >= 500000:
      print('WebRTC stream works with appropriate WebRTC bitrate (at least 500kbps), PASS', file=f_out)
   else:
      print('Too low WebRTC bitrate (<500kbps) or no stream at all, FAIL', file=f_out);
   if webrtc_codec == 'h264':
      print('Correct codec used with WebRTC, PASS', file=f_out)
   else:
      print('WebRTC not using H.264 codec, FAIL', file=f_out);
   
   played_sec = graph_json['PlayedSeconds']
   buffered_sec = graph_json['BufferedSeconds']
   print('HLS stream: played seconds is ', played_sec, ", seconds appended in buffer is ",buffered_sec, file=f_out)
   if played_sec >= 90 and buffered_sec >= 90:
      print('HLS stream played properly, PASS', file=f_out)
   else:
      print('Could not play the HLS stream properly (less than 90 seconds played and/or appended in the buffer), FAIL', file=f_out);
       
   print('Found following HLS stream representations:\n ' + json.dumps(graph_json['Representations'], indent=4), file=f_out)

   target_dur = graph_json['TargetDuration']
   if target_dur == 1:
      print('Correct target duration in the HLS stream (' + str(target_dur) + 's), PASS', file=f_out)
   else:
      print('Target duration in the HLS stream is not as requested (found ' + str(target_dur) + 's), FAIL', file=f_out)

   nb_repr = graph_json['NbRepresentations']
   if nb_repr == 3:
      print('Correct number of representations in HLS stream, PASS', file=f_out)
   else:
      print('Wrong number of representations in HLS stream (' + str(nb_repr) + '), FAIL', file=f_out)
      
   correct_reps = [0, 0, 0]
   for repr in graph_json['Representations']:
      if repr['width'] == 320 and repr['height'] == 180 and repr['bandwidth'] > 200000 and repr['bandwidth'] < 300000:
         correct_reps[0] = 1
      if repr['width'] == 480 and repr['height'] == 360 and repr['bandwidth'] > 450000 and repr['bandwidth'] < 600000:
         correct_reps[1] = 1
      if repr['width'] == 640 and repr['height'] == 480 and repr['bandwidth'] > 900000 and repr['bandwidth'] < 1200000:
         correct_reps[2] = 1
   if sum(correct_reps) == 3:
      print('Resolutions and bitrates are correct in the representations, PASS', file=f_out)
   else:
      print('Resolutions or bitrates are not specified in representations as requested (found ' + str(sum(correct_reps)) + ' correct ones), FAIL', file=f_out)
       
   print('</pre>', file=f_out)
    
except Exception as e:
   print('<pre>Ran into an exception: ',e,'</pre>', file=f_out)
