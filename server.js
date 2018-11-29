const express = require("express");
const https = require("https");
const fs = require("fs");
const chalk = require("chalk");
const bodyparser=require("body-parser");

const app = express();

app.use(express.static("public"));
app.use(bodyparser.urlencoded({extended:false}));
//const info=require("./info.js");

//app.get("/predict",require("./predict.js"));

app.get('/info/:uid',function(req,res){                  //serving GET req for one particular station data
    console.log(req.params.uid);
    
    var contents = fs.readFileSync(req.params.uid+".csv", 'utf8');

    console.log(contents.split("\n").reverse());
    var datarr=contents.split("\n").reverse()[1].split(",");
    console.log(datarr);
    contents = fs.readFileSync("attr.csv", 'utf8');
    var headarr=contents.split("\n")[0].split(",")
    var myobj={};
    headarr.forEach(function(ele,no){
        console.log("no is "+no+"and ele is "+ele)
        myobj[""+ele]=datarr[no];
    });
    console.log(myobj);
    
    
    
    
    
    
    
    res.send(myobj);
    
})

var idarr = [];                    //array to store initial data about all stations
var rec_array = [];


function initiate() {                     //initiate the csv file which stores attribute names
    var head="aqi,dom,co,no2,so2,o3,pm25,pm10,w,year,month,day,hour,min,sec\n"
    fs.appendFile("attr.csv",head, function (err) {
                    if (err) {
                        return console.log(err);
                    }

                    console.log("Data for header attributes updated successfully!");
                });

    
    //latitude and longitude codes hardcoded for delhi city
    
    // token id hard coded..should be in config file
    
    https.get("https://api.waqi.info/map/bounds/?latlng=28.4490,76.8228,28.8645,77.2806&token=a9859ba99c240b8b0bd2718664a75dede866cdf7", function (res) {

        res.on("data", function (chunk) {
            var data = JSON.parse(chunk).data;
            console.log(data.length);
            for (i = 0; i < data.length; i++) {
                idarr.push(data[i].uid);
            }
            console.log(idarr);
            console.log("initiate done");

        })

    })
};
//
//function refresh runs periodically and stores data

function refresh() {
    console.log("Updating Data...");
    idarr.forEach(function (ele) {
        console.log(" Requesting Data for station" + ele);
        https.get("https://api.waqi.info/feed/@" + ele + "/?token=a9859ba99c240b8b0bd2718664a75dede866cdf7", function (res) {

            res.on("data", function (chunk) {
                var data = JSON.parse(chunk).data;
                var timestr = data.time.s;
                
                //extracting min, sec etc from time in string format
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
                    "w": (adata.w ? adata.w.v : -1)
                }
                str = m.aqi + "," + m.dom + "," + m.co + "," + m.no2 + "," + m.so2 + "," + m.o3 + "," + m.pm25 + "," + m.pm10 + "," + m.w + "," + year + "," + month + "," + day + "," + hour + "," + min + "," + sec + "\n";
                
                //now append this str data to csv file for that particular station
                fs.appendFile(ele + ".csv", str, function (err) {
                    if (err) {
                        return console.log(err);
                    }

                    console.log("Data for station " + ele + " updated successfully!");
                });





            })

        })



    });
}

// interval in startnow..to be decided

function startnow(){setInterval(refresh, 60*60*1000);
                   console.log("interval set");};


app.listen(1234, () => {
    console.log("server started");
    initiate();
    
    //set timout should be replaced
    //invoke startnow when initiate finishes
    setTimeout(startnow, 5000);
});
