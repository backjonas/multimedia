const puppeteer = require("puppeteer");
const fs = require('fs');

let print_output = true;

let NETWORK_PRESETS = {
    '400K': {
	'offline': false,
	'downloadThroughput': 400 * 1024 / 8,
	'uploadThroughput': 100000 * 1024 / 8,
	'latency': 0
    },
    '900K': {
	'offline': false,
	'downloadThroughput': 900 * 1024 / 8,
	'uploadThroughput': 100000 * 1024 / 8,
	'latency': 0
    },
    '2000K': {
	'offline': false,
	'downloadThroughput': 2000 * 1024 / 8,
	'uploadThroughput': 100000 * 1024 / 8,
	'latency': 0
    }
}

mynetwork_profile = [
    {
	'bandwidth': NETWORK_PRESETS['2000K'],
	'duration': 30000
    },
    {
	'bandwidth': NETWORK_PRESETS['900K'],
	'duration': 30000
    },
    {
	'bandwidth': NETWORK_PRESETS['400K'],
	'duration': 30000
    }
];


// Open the page and start running the stream
const runner = async () => {

    let filename = "puppeteer_output.json";
    let network_profile = mynetwork_profile
    
    var webrtc_snd_tab;
    var webrtc_rcv_tab;
    var hls_view_tab;
    var browser;
    
    async function cleanup() {
	try {
	    if(webrtc_snd_tab != null && !webrtc_snd_tab.isClosed()) {
		await webrtc_snd_tab.close();
	    }
	    if(webrtc_rcv_tab != null && !webrtc_rcv_tab.isClosed()) {
		await webrtc_rcv_tab.close();
	    }
	    await browser.close();
	} catch (e) {
	    console.error("Cannot cleanup istances: ", e);
	}
    }

    try {
	
	var today = new Date();
	var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
	var time = today.getHours() + "-" + today.getMinutes() + "-" + today.getSeconds();
	var bytes = 0;
	var webrtc_mdata = [0,''];
	var prev_bytes = 0;
	var cur_brate = 0;
	
	// json to store graph and grading values
	var graph = {
	    'WebRTCBitrate':0,
	    'AvailableBandwidth': [],
	    'RequestedBitrate': [],
	    'BufferLevel': [],
	    'MeasuredTput': [],
	    'NbRepresentations':0,
	    'Representations':[],
	    'TargetDuration':0,
	    'PlayedSeconds':0,
	    'BufferedSeconds':0,
	    'WebRTCCodec':'none'
	};

	if(print_output) {
	    console.log("Starting browser");
	}
	browser = await puppeteer.launch({
	    headless: true,
	    executablePath: '/usr/bin/google-chrome',
	    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security', '--user-data-dir=/tmp/user-data', '--use-fake-device-for-media-stream', '--use-file-for-fake-video-capture=/puppeteer/bbb.mjpeg', '-use-fake-ui-for-media-stream', '--autoplay-policy=no-user-gesture-required','--disable-dev-shm-usage', '--disable-gpu']
	});

	// Open the tab for webrtc sender
	if(print_output) {
	    console.log("Opening new tab for sender");
	}
	webrtc_snd_tab = await browser.newPage();
	await webrtc_snd_tab.setCacheEnabled(false);
	// await webrtc_snd_tab.setViewport({
	//     width: 1024,
	//     height: 2048
	// });
	
	await webrtc_snd_tab.waitForTimeout(10000);
	if(print_output) {
	    console.log("Loading webrtc sender page");
	}
	await webrtc_snd_tab.goto(`http://localhost:4000/sender.html`, { waitUntil: "load", timeout: 5000}).catch(function (error) {  throw 'Cannot load WebRTC sender page!';  });
	await webrtc_snd_tab.waitForTimeout(10000);
	if(webrtc_snd_tab.isClosed()) {
	    throw 'Cannot open WebRTC sender page!'
	}

	//open webrtc receiving peer tab
	if(print_output) {
	    console.log("Opening new tab for receiver");
	}
	webrtc_rcv_tab = await browser.newPage();
	await webrtc_rcv_tab.setCacheEnabled(false);
	// await webrtc_rcv_tab.setViewport({
	//     width: 1024,
	//     height: 2048
	// });
	if(print_output) {
	    console.log("Loading webrtc receiver page");
	}
	await webrtc_rcv_tab.goto(`http://localhost:4000/receiver.html`, { waitUntil: "load", timeout: 5000}).catch(function (error) {  throw 'Cannot load WebRTC receiver page!';  });
	await webrtc_rcv_tab.waitForTimeout(5000);
	if(webrtc_rcv_tab.isClosed()) {
	    throw 'Cannot open WebRTC receiver page!'
	}

	for(var h=0; h<5; h++) {
	    prev_bytes = bytes;
	    try {
		webrtc_mdata = await webrtc_rcv_tab.evaluate(() => {
		    return new Promise((resolve, reject) => {
			try {
			    feeds.forEach(feed => {
				if(feed.webrtcStuff.bitrate.bsnow > 0) {
				    resolve([feed.webrtcStuff.bitrate.bsnow, feed.videoCodec]);
				}
			    })
			} catch (error) {
			    reject(error);
			}
		    });});
		bytes = webrtc_mdata[0];
		if(prev_bytes > 0) {
		    cur_brate = (bytes - prev_bytes) * 8;
		    if(print_output) {
			console.log("webrtc bitrate: " + cur_brate / 1000 + " kbps, codec:" + webrtc_mdata[1]);
		    }
		    if(cur_brate > graph['WebRTCBitrate']) {
			graph['WebRTCBitrate'] = cur_brate;
			graph['WebRTCCodec'] = webrtc_mdata[1];
		    }
		}
		await webrtc_rcv_tab.waitForTimeout(1000);
	    } catch(err) {
		throw 'Cannot play WebRTC stream!';
	    }
	}

	//start forwarding RTP
	if(print_output) {
	    console.log("Starting RTP forwarding");
	}
	webrtc_snd_tab.evaluate('fwRTP();');
	await webrtc_rcv_tab.waitForTimeout(5000);
	if(print_output) {
	    console.log("Launching ffmpeg");
	}
	webrtc_snd_tab.evaluate('startFFmpeg();');
	await webrtc_rcv_tab.waitForTimeout(10000);

	//open new tab for HLS stream
	hls_view_tab = await browser.newPage();
	await webrtc_rcv_tab.setCacheEnabled(false);
	if(print_output) {
	    console.log("Loading HLS viewer page");
	}
	// Open Chrome DevTools
	const client = await hls_view_tab.target().createCDPSession();
	await client.send('Network.clearBrowserCookies');
	await client.send('Network.clearBrowserCache');
	// start viewing HLS stream
	await hls_view_tab.goto(`http://localhost:8080/players/hls.html`, { waitUntil: "load" });

	//check representations and segment length
	var target_duration = 0;
	var nb_representations = 0;
	var representations;
	var timeout_sec = 10;
	while(target_duration == 0 && timeout_sec > 0) {
	    await hls_view_tab.waitForTimeout(1000);
	    timeout_sec--;
	    //check representations and segment length
	    try {
		var cur_repr = await hls_view_tab.evaluate(() => {
		    return new Promise((resolve, reject) => {
			try {
			    var repr = player.tech().vhs.representations();
			    if(repr) {
				resolve(repr);
			    } else {
				reject("cannot get representations");
			    }
			} catch (error) {
			    reject(error);
			}
		    });});
		nb_representations = cur_repr.length;
		if(print_output) {
		    console.log("Nb of representations: " + cur_repr.length);
		}
		representations = [];
		for (var h=0; h<cur_repr.length; h++) {
		    if(cur_repr[h].playlist.targetDuration > 0) {
			target_duration = cur_repr[h].playlist.targetDuration;
		    }
		    representations.push({width:cur_repr[h].width, height:cur_repr[h].height, bandwidth:cur_repr[h].bandwidth});
		    if(print_output) {
			console.log("width: " + cur_repr[h].width);
			console.log("height: " + cur_repr[h].height);
			console.log("bandwidth: " + cur_repr[h].bandwidth);
			console.log("targetDuration: " + cur_repr[h].playlist.targetDuration);
		    }
		}
		//console.log("Representations: " + JSON.stringify(representations, null, 2));
	    } catch(err) {
		throw 'Cannot play HLS stream!';
	    }
	}
	graph['TargetDuration'] = target_duration;
	graph['NbRepresentations'] = nb_representations;
	graph['Representations'] = representations;

	//loop through the network profiles one second at a time
	var curTime = 0;
	var nbAppends = 0;
	for (let i = 0; i < network_profile.length; i++) {
	    const setting = network_profile[i];
	    if(print_output) {
		console.log("Switching to throttle network at " + setting['bandwidth']['downloadThroughput']*8 + "bps");
		console.log("Running for " + setting['duration'] + "s");
	    }
	    // Set network limit
	    await client.send('Network.emulateNetworkConditions', setting['bandwidth']);
	    // loop for the duration
	    //await hls_view_tab.waitForTimeout(setting['duration']);
	    for(var d=0; d<setting['duration']/1000; d++) {
		await hls_view_tab.waitForTimeout(1000);
		try {
		    var metadata = await hls_view_tab.evaluate(() => {
			return new Promise((resolve, reject) => {
			    try {
				//get stats
				var stat = player.tech().vhs.stats;
				if(!stat) {
				    reject("cannot get stats");
				}
				//segment metadata
	    			let tracks = player.textTracks();
	    			let segmentMetadataTrack;
	    			for (let i = 0; i < tracks.length; i++) {
	    			    if (tracks[i].label === 'segment-metadata') {
	    				segmentMetadataTrack = tracks[i];
	    			    }
	    			}
	    			if (segmentMetadataTrack) {
	    			    let activeCue = segmentMetadataTrack.activeCues[0];
	    			    if (activeCue) {
					resolve([stat, activeCue.value]);
				    } else {
	    				reject("no active cue found");
	    			    }
	    			} else {
	    			    reject("no segmentmetadata found");
	    			}
			    } catch (error) {
				reject(error);
			    }
			});});
		    var stats = metadata[0];
		    nbAppends = stats['mediaAppends'];
		    curTime = stats.currentTime;
		    var bufferLevel = 0;
		    for (var k=0; k<stats.buffered.length; k++) {
			if(stats.buffered[k]['end'] - curTime > bufferLevel) {
			    bufferLevel = stats.buffered[k]['end'] - curTime;
			}
		    }
		    graph['BufferLevel'].push([bufferLevel,curTime]);
		    var brate = metadata[1].bandwidth;
		    graph['RequestedBitrate'].push([brate, curTime]);
		    graph['AvailableBandwidth'].push([8*network_profile[i]['bandwidth']['downloadThroughput'], curTime]);
		    graph['MeasuredTput'].push([stats.bandwidth, curTime]);
		    if(print_output) {
			console.log("Stats: ");
			console.log("mediaRequests: " + JSON.stringify(stats['mediaRequests'], null, 2));
			console.log("mediaAppends: " + JSON.stringify(stats['mediaAppends'], null, 2));
			console.log("mediaSecondsLoaded: " + JSON.stringify(stats['mediaSecondsLoaded'], null, 2));
	    		console.log("Current bufferlevel (curTime is "+ curTime + "): " + bufferLevel);
	    		console.log("Bitrate of current segment (curTime is "+ curTime + "): " + brate);
	    		console.log("Avail bw (curTime is "+ curTime + "): " + 8*network_profile[i]['bandwidth']['downloadThroughput']);
	    		console.log("Measured tput (curTime is "+ curTime + "): " + stats.bandwidth);
		    }
		    graph['PlayedSeconds'] = curTime;
		    graph['BufferedSeconds'] = nbAppends;
		} catch(err) {
		    throw 'Cannot play HLS stream!';
		}
	    }
	}

	await fs.writeFile('/puppeteer/'+filename, JSON.stringify(graph), function (err) {
		if (err) throw err;
	});
	
	await cleanup();
    } catch (e) {
	console.error("Streaming failed at least partially: " + e);
	await fs.writeFile('/puppeteer/'+filename, JSON.stringify(graph), function (err) {
		if (err) throw err;
	});
	await cleanup();
    }
};

runner();
