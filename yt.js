const fs = require('fs');
const ytdl = require('ytdl-core');
const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let dwnloadDir = './downloaded/';

if (!fs.existsSync(dwnloadDir)){
    fs.mkdirSync(dwnloadDir);
}

let f = 0;
let videosArray = [];

async function download(videos) {
  for (i=0; videos.length > i; i++) {
    let url = videos[i];
    let probsError = false;
    let info = await ytdl.getInfo(url).catch((err) => {
      console.log("Fatal fetching error occured. Skipped: " + url);
      console.log(err);
      f++
      probsError = true;
    });
    if (probsError) {
      continue
    }
    let name = info.videoDetails.title;
    name = name.replace(/\\|\/|\:|\*|\?|\"|\<|\>|\|/g, '');
    let wrtStrm = await fs.createWriteStream(dwnloadDir + name + ".mp3");
    console.log("Downloading url " + url + " under filename " + name + ".mp3");
    await ytdl.downloadFromInfo(info, { filter: 'audioonly', quality: 'highestaudio' })
      .on('error', (err) => {
        console.log("Couldn't get stream from " + url + " (" + name + ") with preferred quality.");
        console.log(err);
        f++
      })
      .pipe(wrtStrm);
    wrtStrm.on('error', (err) => {
      console.log("Couldn't write file " + name);
      console.log(err);
      f++
    });
    wrtStrm.on('finish', () => {
      console.log("Finished downloading " + name);
      f++
    })
  }
}

console.log("Please input your URLs. Hit enter twice when you're done.");

rl.on('line', (input) => {
  if (input == '') {
    rl.emit('close');
    return
  }
  videosArray.push(input);
})

rl.on('close', async () => {
  await download(videosArray).catch(console.error);
  setInterval(() => {
    if (f == videosArray.length) {
      console.log("All pending files have been successfully downloaded.");
      process.exit()
    }
  }, 1000);
});
