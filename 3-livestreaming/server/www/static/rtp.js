var rtpforwarding = {
   request: "rtp_forward",
   room: myroom,
   publisher_id: myid,
   host: "192.168.1.113", //ip of vm
   audio_port: 7500,
   video_port: 7000,
   secret:'adminpwd'
}

sfutest.send({
   message: rtpforwarding,
   success: function (result) {
       console.log(result);
   }
});
