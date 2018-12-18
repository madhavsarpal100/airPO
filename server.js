const express = require("express");
const https = require("https");
const http = require("http");
const fs = require("fs");
const chalk = require("chalk");
const bodyparser = require("body-parser");
const nrc = require("node-run-cmd");
const path = require("path");
var Request = require("request");

const app = express();

app.use(express.static("public"));
app.use(bodyparser.urlencoded({
    extended: false
}));
//const info=require("./info.js");

//app.get("/predict",require("./predict.js"));
app.get("/graph", function (req, res) {
    res.sendFile(path.resolve(path.resolve(__dirname + "/line_chart.jpg")));
})
app.get("/predict/:sid/:aid", function (req, res) {

    console.log("prdect req recieved for " + req.params.sid);
    sid = req.params.sid
    var from = sid + ".csv";
    var to = "common.csv";
    fs.createReadStream(from).pipe(fs.createWriteStream(to));

    var aid = req.params.aid;
    const cmd = require("node-cmd");
    if (aid == 1) {

        cmd.get(
            'ls',
            function (err, data, stderr) {
                console.log('the current dir contains these files :\n\n', data)
            }
        );






    } else {
        res.send({
            "status": "invalid code",
            "data": ""
        })
    }

})


app.get('/info/:uid', function (req, res) {
    console.log(req.params.uid);

    var contents = fs.readFileSync(req.params.uid + ".csv", 'utf8');

    console.log(contents.split("\n").reverse());
    var datarr = contents.split("\n").reverse()[1].split(",");
    console.log(datarr);
    fs.writeFile("now.csv", "time,aqi\n", function (err) {
        if (err) {
            return console.log(err);
        }

        console.log("Data for now file updated successfully!");
    });
    for (var i = 1; i <= 10; i++) {
        var datarr = contents.split("\n").reverse()[11 - i].split(",");
        stra = "" + datarr[12] + "," + datarr[0] + "\n";
        fs.appendFile("now.csv", stra, function (err) {
            if (err) {
                return console.log(err);
            }

            console.log("Data for now file updated successfully!");
        });

    }
    contents = fs.readFileSync("attr.csv", 'utf8');
    var headarr = contents.split("\n")[0].split(",")
    var myobj = {};
    headarr.forEach(function (ele, no) {
        console.log("no is " + no + "and ele is " + ele)
        myobj["" + ele] = datarr[no];

    });
    myobj["pre"] = myobj["aqi"] * 1.07;
    console.log(myobj);
    nrc.run('Rscript a.R>td.txt');
    nrc.run('Rscript pred.R>tdi.txt');

    res.send(myobj);

})

var idarr = [];
var rec_array = [];

function initiate() {


    var head = "aqi,dom,co,no2,so2,o3,pm25,pm10,w,year,month,day,hour,min,sec\n"
    fs.appendFile("attr.csv", head, function (err) {
        if (err) {
            return console.log(err);
        }

        console.log("Data for header attributes updated successfully!");
    });

    https.get("https://api.waqi.info/map/bounds/?latlng=28.4490,76.8228,28.8645,77.2806&token=a9859ba99c240b8b0bd2718664a75dede866cdf7", function (res) {

        res.on("data", function (chunk) {


            var data = JSON.parse(chunk).data;
           
            for (i = 0; i < data.length; i++) {
                var obje = {
                    "uid": data[i].uid,
                    "lat": data[i].lat,
                    "lon": data[i].lon
                };
                idarr.push(obje);
            }
           
            console.log("initiate done");


        })

    })
};

function refresh() {
    console.log("Updating Data...");
    idarr.forEach(function (ele, index) {
        console.log(" Requesting Data for station" + ele.uid);
        https.get("https://api.waqi.info/feed/@" + ele.uid + "/?token=a9859ba99c240b8b0bd2718664a75dede866cdf7", function (res) {

            res.on("data", function (chunk) {
                
                
                var tempob={};
                Request.get("https://api.darksky.net/forecast/a8bd8a1bc8307e92ef4d57ecb18b87bd/" + ele.lat + "," + ele.lon, (error, response, body) => {
                    if (error) {
                        return console.dir(error);
                    }
                    tempob=JSON.parse(body).currently;
                    
                    var data = JSON.parse(chunk).data;
                var timestr = data.time.s;
                var year = timestr.substr(0, 4);
                var month = timestr.substr(5, 2);
                var day = timestr.substr(8, 2);
                var hour = timestr.substr(11, 2);
                var min = timestr.substr(14, 2);
                var sec = timestr.substr(17, 2);
                adata = data.iaqi;


                m = {
                    "aqi": (data.aqi ? data.aqi : -1),
                    "dom": (data.dominentpol ? data.dominentpol : -1),
                    "co": (adata.co ? adata.co.v : -1),
                    "no2": (adata.no2 ? adata.no2.v : -1),
                    "so2": (adata.so2 ? adata.so2.v : -1),
                    "o3": (adata.o3 ? adata.o3.v : -1),
                    "pm25": (adata.pm25 ? adata.pm25.v : -1),
                    "pm10": (adata.pm10 ? adata.pm10.v : -1),
                    "w": (adata.w ? adata.w.v : -1),
                    "temp":tempob.temperature,
                    "humi":tempob.humidity,
                    "wspeed":tempob.windSpeed
                }
                str = m.aqi + "," + m.dom + "," + m.co + "," + m.no2 + "," + m.so2 + "," + m.o3 + "," + m.pm25 + "," + m.pm10 + "," + m.w + "," + year + "," + month + "," + day + "," + hour + "," + min + "," + sec + ","+m.temp+","+m.humi+","+m.wspeed+"\n";
                fs.appendFile(ele.uid + ".csv", str, function (err) {
                    if (err) {
                        return console.log(err);
                    }

                    console.log("Data for station " + ele.uid + " updated successfully!");
                });
                    
                });

                





            })

        })



    });
}

function startnow() {
    setInterval(refresh, 30 * 1000);
    console.log("interval set");
};


app.listen(1234, () => {
    console.log("server started");
    initiate();
    setTimeout(startnow, 5000);
});
