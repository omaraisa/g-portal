import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import KMLLayer from "@arcgis/core/layers/KMLLayer";
import Graphic from "@arcgis/core/Graphic";
import esriRequest from "@arcgis/core/request";
import Geometry from "@arcgis/core/geometry/Geometry";
import Field from "@arcgis/core/layers/support/Field";
import * as GIS from "./gis-module";
import * as XLSX from "xlsx";
import { BlobServiceClient } from "@azure/storage-blob";
import dotenv from 'dotenv'
dotenv.config();
const containerName = process.env.NEXT_PUBLIC_ContainerName;
const sasToken = process.env.NEXT_PUBLIC_SasToken
const storageAccountName = process.env.NEXT_PUBLIC_StorageAccountName
const layerscontainer = process.env.NEXT_PUBLIC_Layerscontainer
const portalUrl = "https://www.arcgis.com";

const uploadFileToBlob = async (file, uploadName) => {
  if (!file) return;

  const blobService = new BlobServiceClient(
    `https://${storageAccountName}.blob.core.windows.net/?${sasToken}`
  );
  const containerClient = blobService.getContainerClient(containerName);
  const uploadedBlob = await createBlobInContainer(
    containerClient,
    file,
    uploadName
  );
  const url = layerscontainer + uploadName;
  return url;
};


const createBlobInContainer = async (containerClient, file, uploadName) => {
  const blobClient = containerClient.getBlockBlobClient(uploadName);
  const options = { blobHTTPHeaders: { blobContentType: file.type } };
  await blobClient.uploadBrowserData(file, options);
};

const uploadedLayersHandler = async ({
  layerInfo,
  fileSelected,
  appContext,
  loading,
  cleanup,
  toggleXYForm,
  goBack,
}) => {
  return new Promise((resolve, reject) => {
    const { fileName, uploadName, fileType, XYColumns, xField, yField } =
    layerInfo;
    const { map, view, widgets, sendMessage } = appContext;
    const layersHandler = {
      json: () => geojsonLayerHandler(),
      geojson: () => geojsonLayerHandler(),
      gpx: () => gpxLayerHandler(),
      kml: () => kmlLayerHandler(),
      kmz: () => kmlLayerHandler(),
      xls: () => XYLayerHandler(),
      xlsx: () => XYLayerHandler(),
      csv: () => XYLayerHandler(),
      txt: () => XYLayerHandler(),
      zip: () => zipShpLayerHandler(),
      preparedLayer: () => addXYLayer(),
    };
    let XYFeatures = layerInfo.XYFeatures? layerInfo.XYFeatures :[];  
    const params = {
      name: fileName,
      targetSR: view.spatialReference,
      maxRecordCount: 4000,
      enforceInputFileSizeLimit: true,
      enforceOutputJsonSizeLimit: true,
      generalize: true,
      maxAllowableOffset:10,
      reducePrecision:true,
      numberOfDigitsAfterDecimal:0,
    };
    
    const myContent = {
      publishParameters: JSON.stringify(params),
      f: "json",
    };
    

    async function gpxLayerHandler() {
      let data = new FormData();
      data.append("file", fileSelected, fileName);
      
      esriRequest(portalUrl + "/sharing/rest/content/features/generate", {
        query: {...myContent,filetype: "gpx"},
        body: data,
        responseType: "json",
      })
        .then((response) => {
          addShapefileToMap(response.data.featureCollection);
        })
        .catch((error) => {
          handleError(
            `???????????? ???????? ?????????? ???????????? ?????????? ???????????? ???????????? ???? ????????????????`
          );
          console.log(error);
        });

      }


    async function geojsonLayerHandler() {
      let data = new FormData();
      data.append("file", fileSelected, fileName);
      
      esriRequest(portalUrl + "/sharing/rest/content/features/generate", {
        query: {...myContent,filetype: "geojson"},
        body: data,
        responseType: "json",
      })
        .then((response) => {
          addShapefileToMap(response.data.featureCollection);
        })
        .catch((error) => {
          handleError(
            `???????????? ???????? ?????????? ???????????? ?????????? ???????????? ???????????? ???? ????????????????`
          );
          console.log(error);
        });
        
    }

    async function kmlLayerHandler() {
      const uploadedFile = await uploadFileToBlob(fileSelected, uploadName);
      const kmlLayer = new KMLLayer({ url: uploadedFile, title: fileName });
      addLayerToMap(kmlLayer);
    }

    function XYLayerHandler() {
      async function processXYData(data) {
        return new Promise((resolve, reject) => {
          try {
            let workbook = XLSX.read(data, {
              type: "binary",
            });

            let firstSheetName = workbook.SheetNames[0];
            let firstSheet = workbook.Sheets[firstSheetName];
            let newWorkSheet = XLSX.utils.sheet_to_json(firstSheet);
            let newWorkbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(
              newWorkbook,
              newWorkSheet,
              "CSV_Sheet"
            );
            resolve(newWorkSheet);
          } catch (error) {
            reject((error) => {
              console.log(error);
              return null;
            });
          }
        });
      }

      let reader = new FileReader();
      reader.readAsBinaryString(fileSelected);
      reader.onload = async function (e) {
        XYFeatures = await processXYData(e.target.result);
        if (await XYFeatures) {
          const XYColumns = Object.keys(await XYFeatures[0]);
          toggleXYForm(XYColumns,XYFeatures);
        } else {
          sendMessage({
            type: "error",
            title: "?????? ????????",
            body: `???????????? ???????? ?????????? ???????????? ?????????? ???????????? ???????????? ???? ?????? ????????????????`,
          });
        }
      };
    }

    async function addXYLayer() {
      const { fields, fieldInfos } = await getFields(XYColumns, XYFeatures);

      const layerSource = [];
      XYFeatures.forEach((feature, index) => {
        const xLon = feature[xField];
        const yLat = feature[yField];

        if (!feature.ObjectID) feature.ObjectID = index;

        const point = {
          type: "point",
          longitude: xLon,
          latitude: yLat,
        };

        let markerSymbol = {
          type: "simple-marker",
          color: [226, 119, 40],
        };

        const pointGraphic = new Graphic({
          geometry: point,
          symbol: markerSymbol,
          attributes: feature,
        });

        layerSource.push(pointGraphic);
      }); //---------END forEach ------------------------

      let XYLayerPopupTemplate = {
        title: "???????????? ?????? {ObjectID}",
        content: [
          {
            type: "fields",
            fieldInfos: fieldInfos,
          },
        ],
      };
      fields.unshift({
        name: "ObjectID",
        type: "oid",
      });

      const XYLayer = new FeatureLayer({
        title: fileName,
        fields,
        objectIdField: "ObjectID",
        geometryType: "point",
        popupTemplate: XYLayerPopupTemplate,
        source: layerSource,
      });

      addLayerToMap(XYLayer);
      goBack();
    }

    let loadChecker;
    const layerLoadingAction = (type, title, body) => {
      sendMessage({
        type: type,
        title: title,
        body: body,
      });
      clearInterval(loadChecker);
      loading(false);
      cleanup();
    };

    const loadingTrigger = {
      loaded: () =>
        layerLoadingAction(
          "info",
          "?????????? ????????",
          "???? ?????????? ???????????? ?????? ?????????????? ??????????"
        ),
      failed: () =>
        layerLoadingAction(
          "error",
          "?????????? ????????",
          "???????????? ???????? ?????????? ?????????? ?????????????? ???????? ???? ????????????"
        ),
    };

    const loadingCheck = (layer) => {
      loadChecker = setInterval(() => {
        if (loadingTrigger[layer.loadStatus])
          loadingTrigger[layer.loadStatus]();
      }, 1000);
    };

    function addLayerToMap(uploadedLayer) {
      map.add(uploadedLayer);
      loadingCheck(uploadedLayer);
      uploadedLayer.when(() => {
        widgets["legend"].layerInfos.push({
          layer: uploadedLayer,
        });
        view.goTo(uploadedLayer.fullExtent);
      });
    }

    async function zipShpLayerHandler() {
      let data = new FormData();
      data.append("file", fileSelected, fileName);

      esriRequest(portalUrl + "/sharing/rest/content/features/generate", {
        query: {...myContent,filetype: "shapefile"},
        body: data,
        responseType: "json",
      })
        .then((response) => {
          addShapefileToMap(response.data.featureCollection);
        })
        .catch((error) => {
          handleError(
            `???????????? ???????? ?????????? ???????????? ?????????? ???????????? ???????????? ???? ????????????????`
          );
          console.log(error);
        });
    }

    try {
      resolve(layersHandler[fileType]());
    } catch (error) {
      reject(error);
    }

    function handleError(message) {
      loading(false);
      cleanup();
      sendMessage({
        type: "error",
        title: "???????????? ???????? Shapefile",
        body: message,
      });
    }

    function addShapefileToMap(featureCollection) {
      let sourceGraphics = [];
    
      const layers = featureCollection.layers.map((layer) => {
        const geometryType =
          geometryTermsCorrection[layer.layerDefinition.geometryType];
    
        const symbol = GIS.symbols[geometryType];
        symbol.color =
          "#" + Math.floor(Math.random() * 16777215).toString(16);
    
        const renderer = {
          type: "simple",
          symbol,
        };
    
        const fields = layer.layerDefinition.fields.map((field) => {
          return Field.fromJSON(field);
        });
        const fieldInfos = fields.map((field) => ({
          fieldName: field.name,
        }));
    
        let popupTemplate = {
          content: [
            {
              type: "fields",
              fieldInfos,
            },
          ],
        };
    
        const graphics = layer.featureSet.features.map((feature) => {
          return Graphic.fromJSON(feature);
        });
        sourceGraphics = sourceGraphics.concat(graphics);
        const featureLayer = new FeatureLayer({
          title: layer.layerDefinition.name,
          objectIdField: "FID",
          source: graphics,
          fields,
          renderer,
          popupTemplate,
          popupEnabled: true,
        });
        return featureLayer;
      });
      map.addMany(layers);
      view
        .goTo(sourceGraphics)
        .then(() => {
          loading(false);
          cleanup();
          sendMessage({
            type: "info",
            title: "?????????? ???????? Shapefile",
            body: "?????? ?????????? ???????????? ?????????? ?????? ??????????????",
          });
        })
        .catch((error) => {
          if (error.name != "AbortError") {
            console.error(error);
          }
        });
    }    
  });
};

export default uploadedLayersHandler;



async function getFields(XYColumns, XYFeatures) {
  const fields = [];
  const fieldInfos = [];
  XYColumns.forEach((column) => {
    let columnType = "string";
    for (let feature of XYFeatures) {
      if (feature[column] !== null && feature[column] !== undefined) {
        if (typeof feature[column] === "number") columnType = "double";
        else {
          columnType = "string";
          break;
        }
      }
    }
    fields.push({
      name: column,
      type: columnType,
    });
    fieldInfos.push({
      fieldName: column,
    });
  });
  return { fields, fieldInfos };
}

const geometryGetter = {
  point: (coordinates) => getPointGeom(coordinates),
  polygon: (coordinates) => getPolygonGeom(coordinates),
  polyline: (coordinates) => getlineGeom(coordinates),
};

function getPointGeom(coordinates) {
  return {
    latitude: coordinates[0],
    longitude: coordinates[1],
    type: "point",
  };
}
function getPolygonGeom(coordinates) {
  return {
    rings: coordinates,
    type: "polygon",
  };
}

function getlineGeom(coordinates) {
  return {
    paths: coordinates,
    type: "polyline",
  };
}

const geometryTermsCorrection = {
  point: "point",
  Point: "point",
  esriGeometryPoint: "point",
  esriGeometryMultipoint: "point",
  line: "polyline",
  multiline: "polyline",
  Multiline: "polyline",
  MultiLine: "polyline",
  Line: "polyline",
  LineString: "polyline",
  polyline: "polyline",
  Polyline: "polyline",
  esriGeometryPolyline: "polyline",
  polygon: "polygon",
  Polygon: "polygon",
  esriGeometryPolygon: "polygon",
  multipolygon: "polygon",
  Multipolygon: "polygon",
  MultiPolygon: "polygon",
};

export const allowedExtensions = [
  "csv",
  "txt",
  "xls",
  "xlsx",
  "txt",
  "json",
  "geojson",
  "kml",
  "kmz",
  "gpx",
  "zip",
];
export const maximumAllowedSize = {
  csv: 50000000,
  txt: 50000000,
  xls: 50000000,
  xlsx: 50000000,
  txt: 50000000,
  json: 10000000,
  geojson: 10000000,
  kml: 2000000,
  kmz: 2000000,
  gpx: 2000000,
  zip: 2000000,
};
