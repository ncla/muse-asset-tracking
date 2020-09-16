const axios = require('axios').default;
const cheerio = require('cheerio');
const fs = require('fs');
const env = process.env;
require('dotenv').config();
const SocksProxyAgent = require('socks-proxy-agent');

let mainSiteCss = [];
let mainSiteJs = [];
let cssMain;
let jsMain;

const proxy = env.SOCKS_PROXY.split(":");
const httpsAgent = new SocksProxyAgent({host: proxy[0], port: proxy[1]});
const axiosClient = axios.create(httpsAgent);

const requestHeaders = {
    'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:77.0) Gecko/20100101 Firefox/77.0',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Pragma': 'no-cache',
    'Cache-Control': 'no-cache',
    'TE': 'Trailers'
};

(async function() {
    await axiosClient({
        method: 'get',
        url: 'https://www.muse.mu/news',
        headers: requestHeaders
    }).then((response) => {
        let $ = cheerio.load(response.data)
        mainSiteCss = $('link[rel="stylesheet"][type="text/css"]').map((index, style) => {
            if ($(style).attr('href').indexOf('://www.muse.mu/') !== -1) {
                return $(style).attr('href')
            }
        }).get()
        mainSiteJs = $('script[type="text/javascript"][src]').map((index, script) => {
            if ($(script).attr('src').indexOf('://www.muse.mu/') !== -1) {
                return $(script).attr('src')
            }
        }).get()
    })
    .catch((error) => {
        console.error(error);
    })

    await Promise.all(mainSiteCss.map(url => {
        return axiosClient({
            method: 'get',
            url: url,
            headers: requestHeaders
        }).then((response) => {
            cssMain += response.data
        })
        .catch((error) => {
            console.error(error);
        })
    }))

    await Promise.all(mainSiteJs.map(url => {
        return axiosClient({
            method: 'get',
            url: url,
            headers: requestHeaders
        }).then((response) => {
            jsMain += response.data
        })
        .catch((error) => {
            console.error(error);
        })
    }))

    const dir = './assets';

    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }

    fs.writeFile('assets/musemu.css', cssMain, { flag: 'w' },function(err) {
        if (err) {
            return console.log(err);
        }
    });

    // Some stupid shit that errors out Prettier
    jsMain = jsMain.replace(/<!--.+-->/gi, '')

    fs.writeFile('assets/musemu.js', jsMain, { flag: 'w' },function(err) {
        if (err) {
            return console.log(err);
        }
    });
})();