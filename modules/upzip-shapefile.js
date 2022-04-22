
import unzipper from "unzipper";
import fs from "fs";


export default function UnzipShapefile(zippedShapefile,__dirname,req,res) {
  let fileName,fileExtension,requiredFiles=0;
  return new Promise((resolve, reject) => {
    fs.createReadStream(__dirname + '/uploads/' + zippedShapefile)
    .pipe(unzipper.Parse())
    .on('entry', function (entry) {
      fileName = entry.path.split(".")[0] + new Date().getDate();
      fileExtension =  entry.path.split(".")[1];
      // const type = entry.type; // 'Directory' or 'File'
      // const size = entry.vars.uncompressedSize; // There is also compressedSize;
      // fileExtension === "shp" || fileExtension === "shx" || fileExtension === "dbf" || fileExtension === "prj" || fileExtension === "sbn " || 
      // fileExtension === "sbx " || fileExtension === "fbn " || fileExtension === "fbx " || fileExtension === "ain " || fileExtension === "aih " || 
      // fileExtension === "atx " || fileExtension === "ixs " || fileExtension === "mxs " || fileExtension === "xml " || fileExtension === "cpg "
      if (fileExtension === "shp" || fileExtension === "shx" || fileExtension === "dbf" || fileExtension === "prj" ) 
      {
        entry.pipe(fs.createWriteStream(__dirname + '/uploads/'+fileName+'.'+fileExtension));
        requiredFiles++
        if(requiredFiles>3)
        {
        resolve(fileName)
      }
      } else {
        entry.autodrain();
      }
      
    });
  });
}

