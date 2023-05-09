let { marker, layerGroup, icon, latLng } = require('leaflet');
let {control} = require('leaflet-routing-machine');
let {provider} = require('leaflet-providers');
let {curve,Curve} = require('@elfalem/leaflet-curve');

let mysql=require('mysql');
let rebalancepoint=[L.latLng(22.6317876, 120.3038053)]
const ctx = document.getElementById('myChart');
const ctx1 = document.getElementById('myChart1');
const onehourchart = document.getElementById('hourchart');


let stationblock=document.getElementById("mydiv");
let stationname=document.getElementById("stationname");
let total=document.getElementById("total");
let bike=document.getElementById("bike");
let free=document.getElementById("free");

let gc=document.getElementById("goodcount");
let sc=document.getElementById("sleepingcount");
let ub=document.getElementById("unbalancecount");

let list = document.getElementById("unbalance-list");
let triplist = document.getElementById("triprecord");
let weathertype = document.getElementById("wtype");
let temp = document.getElementById("temp");
let humidity = document.getElementById("humidity");
let tempmin = document.getElementById("tempmin");
let tempmax = document.getElementById("tempmax");
let pressure = document.getElementById("pressure");
let wind = document.getElementById("wind");
let cloud = document.getElementById("cloud");
let rain = document.getElementById("rain");

let unbalance=[];
let sleeping=[];
let nobikelist=[];
let nospacelist=[];

const date = new Date('April 1, 2023, 06:50:20');
const nextdate = new Date('April 1, 2023 06:51:14');

const datesAreOnSameDay = (first, second) =>
    first.getDate() === second.getDate()   &&
    first.getHours() === second.getHours() &&
    first.getMinutes() === second.getMinutes() &&
    first.getSeconds() === second.getSeconds();

let last=-1;
let btn_sel="btn-all";    


let osm = L.tileLayer.provider('Jawg.Streets', {
    accessToken: 'tyv8SuGPBrZkqBtfuwlOAIDaRP9QHksdNVJBx2ErYlwI00PE2DsskocSnmBzHon7',
	maxZoom: 16,
    minZoom: 13,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

let allmarkergroup = L.layerGroup();
let unbalancemarkergroup = L.layerGroup();


let map = L.map('map',{
    zoomControl:false,
    center:[22.62418, 120.30883],
    zoom:14,
    layers:[osm,allmarkergroup]
});


let overlayMaps={
    "所有站點":allmarkergroup,
    "不平衡站點":unbalancemarkergroup
}
L.control.layers(overlayMaps).addTo(map);


let safe = L.icon({
    iconUrl: './img/safe.png',
    iconSize:     [36, 36],
    iconAnchor: [18,36],
    popupAnchor:  [0, -16]
});

let nobike = L.icon({
    iconUrl: './img/nobike.png',
    iconSize:     [36, 36],
    iconAnchor: [18,36],
    popupAnchor:  [0, -16]
});

let nospace = L.icon({
    iconUrl: './img/nospace.png',
    iconSize:     [36, 36],
    iconAnchor: [18,36],
    popupAnchor:  [0, -16]
});

let sleep = L.icon({
    iconUrl:'./img/sleep.png',
    iconSize: [36,36],
    iconAnchor: [18,36],
    popupAnchor:  [0, -16]
})

let truck = L.icon({
    iconUrl:'./img/truck.png',
    iconSize:[36,36],
    iconAnchor:[18,36],
})


let initsql="SELECT id,name,area,lat,lng,bike,freespace,total_space,active,recordTime FROM stationinfo INNER JOIN test ON stationinfo.id = test.stationID where recordTime = '2023-04-01 06:50:26' ORDER BY id ASC ";
//let sql='SELECT id,name,area,lat,lng,bike,freespace,total,active FROM stationinfo INNER JOIN last_update ON stationinfo.id = last_update.stationID ORDER BY id ASC';
//let sql='SELECT * FROM stationinfo ORDER BY id ASC';

function getweather(connect){
    let weathersql="SELECT * FROM weather_record where update_time = '2023-04-01 00:00:26'";
    connect.query(weathersql,function(error,results,fields){
        temp.innerHTML=results["temp"];
        humidity.innerHTML=results["humidity"];
        tempmin.innerHTML=results["temp_min"];
        tempmax.innerHTML=results["temp_max"];
        pressure.innerHTML=results["pressure"];
        wind.innerHTML=results["wind"];
        cloud.innerHTML=results["cloud"];
        rain.innerHTML =results["rain"];
        document.getElementById("wtype").innerHTML=results["weather"];
        
    })
}

const connection =  mysql.createConnection({
    host: '127.0.0.1',
    port: '3306',
    user: 'joeyhuang',
    password: 'open0813',
    database: 'youbike'
});

connection.connect((error) => {
if(error){
    console.log("error occurred", error);
} 
else{
    //initialize station info
    connection.query(initsql,function(error,results,fields){
        for(let i=0;i<results.length;i++){
            let markericon;
            if(results[i].active==0){
                markericon=sleep;
                sleeping.push(results[i]);
                unbalance.push(results[i]);
            }
            else{
                if(results[i].freespace==0){
                    markericon=nospace;
                    unbalance.push(results[i])
                    nospacelist.push(results[i])
                }
                else if(results[i].bike==0){
                    markericon=nobike;
                    unbalance.push(results[i]);
                    nobikelist.push(results[i]);
                }
                else{
                    markericon=safe;
                }
            }
            let config={
                icon:markericon,
                customID:i,
                stationid:results[i].id,
                name:results[i].name,
                total:results[i].total_space,
                freespace:results[i].freespace,
                bike:results[i].bike,
                active:results[i].active,
                area:results[i].area
            }
            //add new marker on the map
            marker = new L.marker([results[i].lat, 
                results[i].lng],config)
                .bindPopup(results[i].name+" "+results[i].id)
                .on('click',function(){
                    map.setView(this.getLatLng(),15);
                    let tmptime = new Date(date)
                    tmptime.setHours(tmptime.getHours()+8);
                    tmptime = tmptime.toISOString().replace('T',' ').slice(0,19);
                    tmptime = "'"+tmptime+"'";
                    console.log(this.options.stationid);
                    let id=this.options.stationid
                    let tripsql="select * from triprecord where start_time > "+tmptime+" - interval 1 hour and start_time <= "+tmptime+" and (start = "+this.options.stationid.toString()+" or end = "+this.options.stationid.toString()+")";
                    connection.query(tripsql,function(error,results,fields){
                        createtriplist(results,id);
                    })
                    stationname.innerHTML = this.options.name;
                    total.innerHTML = "總車位數: "+this.options.total;                               
                    bike.innerHTML = "目前提供車輛: "+this.options.bike;             
                    free.innerHTML = "目前提供車位: "+this.options.freespace;
                    if(stationblock.style.display==="none"||(last!=this.options.customID)){
                        last=this.options.customID;
                        stationblock.style.display="block";
                    }
                    else{
                        stationblock.style.display="none";
                    }
            });
            allmarkergroup.addLayer(marker);
            if(markericon==nospace||markericon==nobike){
                unbalancemarkergroup.addLayer(marker);
            }
            
        }
        
        unbalancemarkergroup.eachLayer(function (layer){
            if(layer.options.area=="鹽埕區"||layer.options.area=="前金區"||layer.options.area=="苓雅區"||layer.options.area=="鼓山區"||layer.options.area=="新興區"){
                console.log(layer.options.stationid);
                rebalancepoint.push(layer._latlng);
                
            }
        })
        console.log(rebalancepoint)
        let route = L.Routing.control({
        waypoints: rebalancepoint,
        routeWhileDragging: false,
        createMarker: function() { return null; }
        }).addTo(map);
        
        gc.innerHTML=1201-sleeping.length-unbalance.length;
        sc.innerHTML=sleeping.length;
        ub.innerHTML=unbalance.length-sleeping.length;
        createlist(btn_sel);                    
    });
    //add truck dummy data, position at 美麗島站
    marker = new L.marker([22.6317876, 120.3038053],{icon:truck}).addTo(map);
}
});

//update the station data for every one minute.
function update_data() {
    rebalancepoint=[L.latLng(22.6317876, 120.3038053)]
    let currtime = nextdate
    currtime.setHours(currtime.getHours()+8);
    currtime = currtime.toISOString().replace('T',' ').slice(0,19);
    currtime = "'"+currtime+"'";
    let nextsql="select * from test where recordTime = (select min(recordTime) from test where recordTime > "+currtime+")";
    let currentsql="select * from test where recordTime = "+currtime+" ORDER BY stationID ASC";
    connection.query(nextsql,function(error,results,fields){
        nextdate.setTime(results[0].recordTime);
    })
    connection.query(currentsql,function(error,results,fields){
        allmarkergroup.eachLayer(function (layer){
            layer.options.freespace=results[layer.options.customID].freespace;
            layer.options.bike=results[layer.options.customID].bike;
            layer.options.active=results[layer.options.customID].active;
            if(layer.options.icon==nobike||layer.options.icon==nospace){
                unbalancemarkergroup.removeLayer(layer);
            }
            if(layer.options.active==0){
                layer.setIcon(sleep);
            }
            else{
                if(layer.options.bike==0){
                    layer.setIcon(nobike);
                    unbalancemarkergroup.addLayer(layer);
                }
                else if(layer.options.freespace==0){
                    layer.setIcon(nospace);
                    unbalancemarkergroup.addLayer(layer);
                }
                else{
                    layer.setIcon(safe);
                }
            }
            if(layer.options.customID==last){
                if(stationblock.style.display==="block"){
                    bike.innerHTML="bike: "+layer.options.bike;
                    free.innerHTML="free: "+layer.options.freespace;
                }
            }
        })
        createlist(btn_sel);

        gc.innerHTML=1201-sleeping.length-unbalance.length;
        sc.innerHTML=sleeping.length;
        ub.innerHTML=unbalance.length-sleeping.length;
        console.log("update");
        if(error){
            console.log(error);
        }
    })
    unbalancemarkergroup.eachLayer(function(layer){
        rebalancepoint.push(layer._latlng);
    })
    updateRoute = function () {
        routingControl.getPlan().setWaypoints(rebalancepoint);
    };
};


let previous=document.getElementById("btn-all")

document.querySelectorAll('li button').forEach(occurence => {
    let id = occurence.getAttribute('id'); 
    occurence.addEventListener('click', function() {
        if(occurence.classList.contains("active")){
            console.log('A button with ID ' + id + ' was clicked!')
        }
        else{
            previous.classList.remove("active")
            occurence.classList.add("active")
            previous=occurence
            btn_sel=id;
            createlist(btn_sel);
        }
        
    } );
});

function addTableRow(results,current){
    let table = document.getElementById("tableData");
    
    let st="";
    let parse=[];
    let type="";
    for(let i=0;i<results.length;i++){
        let rowCount = table.rows.length;
        let row = table.insertRow(rowCount);
        if(results[i].start===current){
            st =results[i].start_time.toString();
            parse = st.split(' ');
            current = results[i].end;
            type="借";
        }
        else{
            st =results[i].start_time.toString();
            parse = st.split(' '); 
            current = results[i].start;
            type="還";   
        }
        row.insertCell(0).innerHTML= parse[4];
        row.insertCell(1).innerHTML= type;
        row.insertCell(2).innerHTML= current;
    }
}

function createtriplist(results,current){
    let htmlElements = "";
    let start,end;
    addTableRow(results,current);
    for (let i = 0; i < results.length; i++) {
        htmlElements += '<div id="triplist'+i+'"></div>';
        
    }                    
    triplist.innerHTML = htmlElements;
    //let polyline = L.polyline(latlngs, {color: 'red'}).addTo(map);
    if(results.length===0){
        console.log("none");
    }   
    else{
        for (let i = 0; i < results.length; i++) {
            let li=document.getElementById("triplist"+i);
            li.innerHTML=results[i].start;
            li.style.color="aliceblue";
            if(results[i].start===current){
                let st =results[i].start_time.toString();
                let parse = st.split(' ');
                li.style.background="#35342F";
                li.innerHTML=parse[4];
            }
            else{
                let st =results[i].start_time.toString();
                let parse = st.split(' ');
                li.style.background="#E74C3C";
                li.innerHTML=parse[4];
        
            }
            allmarkergroup.eachLayer(function (layer){
                if(layer.options.stationid===results[i].start){
                    start=layer;
                }
                if(layer.options.stationid===results[i].end){
                    end=layer;
                } 
            });
            // let latlng1 = [start._latlng.lat, start._latlng.lng],
            //     latlng2 = [end._latlng.lat, end._latlng.lng];
            // let offsetX = latlng2[1] - latlng1[1],
            //     offsetY = latlng2[0] - latlng1[0];
            // let r = Math.sqrt(Math.pow(offsetX, 2) + Math.pow(offsetY, 2)),
            //     theta = Math.atan2(offsetY, offsetX);
            // let thetaOffset = (3.14 / 10);
            // let r2 = (r / 2) / (Math.cos(thetaOffset)),
            //     theta2 = theta + thetaOffset;
            // let midpointX = (r2 * Math.cos(theta2)) + latlng1[1],
            //     midpointY = (r2 * Math.sin(theta2)) + latlng1[0];
            // let midpointLatLng = [midpointY, midpointX];
            // let pathOptions = {
            //     color: 'red',
            //     weight: 3
            // }
            // let curvedPath = L.curve([
            //         'M', latlng1,
            //         'Q', midpointLatLng,
            //         latlng2
            //     ], pathOptions).addTo(map);

        }
    }
    
}


//create unbalance station list    
function createlist(btn){
    let htmlElements = "";
    if(btn=="btn-all"){
        for (let i = 0; i < unbalance.length; i++) {
            htmlElements += '<div id="list'+i+'"></div>';
        }                    
        list.innerHTML = htmlElements;
        for (let i = 0; i < unbalance.length; i++) {
            let li=document.getElementById("list"+i);
            li.innerHTML=unbalance[i].name;
            li.style.color="aliceblue";
            if(unbalance[i].active==0){
                li.style.background="#35342F";
            }
            else{
                if(unbalance[i].freespace==0){
                    li.style.background="#E7C63C";
                }
                else if(unbalance[i].bike==0){
                    li.style.background="#E74C3C";
                }
            }
        } 
    }
    else if(btn=="btn-mod"){
        for (let i = 0; i < sleeping.length; i++) {
            htmlElements += '<div id="list'+i+'"></div>';
        }                    
        list.innerHTML = htmlElements;
        for (let i = 0; i < sleeping.length; i++) {
            let li=document.getElementById("list"+i);
            li.innerHTML=sleeping[i].name;
            li.style.color="aliceblue";
            li.style.background="#35342F";
        } 
    }
    else if(btn=="btn-full"){
        for (let i = 0; i < nospacelist.length; i++) {
            htmlElements += '<div id="list'+i+'"></div>';
        }                    
        list.innerHTML = htmlElements;
        for (let i = 0; i < nospacelist.length; i++) {
            let li=document.getElementById("list"+i);
            li.innerHTML=nospacelist[i].name;
            li.style.color="aliceblue";
            li.style.background="#E7C63C";
        } 
    }
    else{
        for (let i = 0; i < nobikelist.length; i++) {
            htmlElements += '<div id="list'+i+'"></div>';
        }                    
        list.innerHTML = htmlElements;
        for (let i = 0; i < nobikelist.length; i++) {
            let li=document.getElementById("list"+i);
            li.innerHTML=nobikelist[i].name;
            li.style.color="aliceblue";
            li.style.background="#E74C3C";
        } 
    }
}


//the search box function
function search_station(){
    let searchid = document.getElementById("site-search").value
    let nomatch=true;
    allmarkergroup.eachLayer(function (layer){
        if(searchid==layer.options.stationid){

            msg=document.getElementById("valid-msg");
            msg.style.opacity='1';
            setTimeout(()=>{
                msg.style.opacity = '0'
            },2000)
            stationname.innerHTML = layer.options.name;
            total.innerHTML = "total: "+layer.options.total;                               
            bike.innerHTML = "bike: "+layer.options.bike;             
            free.innerHTML = "free: "+layer.options.freespace;
            map.setView([layer._latlng.lat,layer._latlng.lng],16);
            layer.openPopup();
            last=layer.options.customID;
            stationblock.style.display="block";
            nomatch=false;
            
            
        }
    })

    if(nomatch){
        msg=document.getElementById("invalid-msg");
        msg.style.opacity='1';
        setTimeout(()=>{
            msg.style.opacity = '0'
        },2000)
    }
}


// real-time clock function
function display_ct7() {

    let hours = date.getHours().toString();
    hours=hours.length==1? 0+hours : hours;
    
    let minutes=date.getMinutes().toString()
    minutes=minutes.length==1 ? 0+minutes : minutes;
    
    let seconds=date.getSeconds().toString()
    seconds=seconds.length==1 ? 0+seconds : seconds;
    
    let month=(date.getMonth() +1).toString();
    month=month.length==1 ? 0+month : month;
    
    let dt=date.getDate().toString();
    dt=dt.length==1 ? 0+dt : dt;
    
    let x1=month + "/" + dt + "/" + date.getFullYear(); 
    x1 = x1 + " - " +  hours + ":" +  minutes + ":" +  seconds + " ";
    document.getElementById('ct7').innerHTML = x1;
    display_c7();
}
function display_c7(){
        let refresh=1000; // Refresh rate in milli seconds
        if(datesAreOnSameDay(date,nextdate)){
            update_data();
        }
        date.setSeconds(date.getSeconds() + 1);
        mytime=setTimeout('display_ct7()',refresh)
}
display_c7()


new Chart(ctx, {
    type: 'bar',
    data: {
        labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
        datasets: [{
            label: '# of Votes',
            data: [12, 19, 3, 5, 2, 3],
            color:'#ffffff',
            borderWidth: 1
        }]
    },
    options: {
        scales: {
        x: {
            ticks: {
                font: {
                    size:6
                }
            }
        },
        y: {
            beginAtZero: true
        }
        }
    }
});

let timeFormat='%HH:%MM';

new Chart(ctx1, {
    type: 'line',
    data: {
        datasets: [{
            label: '氣溫',
            data: [],
            borderWidth: 1
        }]
    },
    options: {
        maintainAspectRatio:false,
        responsive:true,
        plugins:{
            legend:{
                labels:{
                    boxWidth:20,
                    
                    
                    font:{
                        size:6
                    }
                }
            }
        }
    }
});

new Chart(hourchart, {
    type: 'line',
    data: {
        labels: ['01:00', '02:00', '03:00', '04:00', '05:00', '06:00','07:00'],
        datasets: [{
            label: '一小時站點平衡情況',
            data: [12, 19, 3, 5, 2, 3,-3],
            color:'#ffffff',
            borderWidth: 1
        }]
    },
    options: {
        plugins:{
            legend:{
                labels:{
                    boxWidth:20,
                    
                    color:'#ffffff',
                    font:{
                        size:6
                    }
                }
            }
        },
        scales: {
        x: {
            ticks: {
                color:"#ffffff",
                font: {
                    size:6
                }
            }
        },
        y: {
            min:-30,
            max:30,
            beginAtZero: true,
            ticks: {
                color:"#ffffff",
                font: {
                    size:6
                }
            }
        }
        }
    }
});

