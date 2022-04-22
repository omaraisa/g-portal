// This function will execute asynchronously without blocking anything

import shapefile from 'shapefile';

export default async function shp2json(uploadedShpName,req,res) {
    let geojsonResult = []
    return new Promise((resolve, reject) => {
        shapefile.open("uploads/" +uploadedShpName+".shp","uploads/" +uploadedShpName+".dbf",{encoding :"utf-8"})
        .then(source => source.read()
            .then(function log(result) {
                if (result.done) return;
                geojsonResult.push(result.value)
                //console.log("geojsonResult = ",geojsonResult)
                return source.read().then(log);
            })).then(() => {
                res.statusCode = 200
                resolve({status:"success", layername:uploadedShpName, result: geojsonResult})
            })
        .catch(error =>  {
            res.statusCode = 400
            resolve({status:"failure", msg: error})
        });
        
    });
}
   

