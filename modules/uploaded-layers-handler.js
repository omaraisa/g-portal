import CSVLayer from "@arcgis/core/layers/CSVLayer";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer";
import KMLLayer from "@arcgis/core/layers/KMLLayer";
import Graphic from "@arcgis/core/Graphic";
// import csvToJson from "convert-csv-to-json/src/csvToJson";
import * as XLSX from "xlsx";
import { BlobServiceClient } from "@azure/storage-blob";

const containerName = "layerscontainer";
const sasToken =
  "sp=racwl&st=2022-04-15T03:36:05Z&se=2023-05-01T11:36:05Z&spr=https&sv=2020-08-04&sr=c&sig=6SrywdHjgYxen9HMXwi5ZODlRg7z6I2Pjb0VAqNl%2FTc%3D";
const storageAccountName = "mygportalstorage";

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
  const url = `https://mygportalstorage.blob.core.windows.net/layerscontainer/${uploadName}`;
  return url;
};

const createBlobInContainer = async (containerClient, file, uploadName) => {
  const blobClient = containerClient.getBlockBlobClient(uploadName);
  const options = { blobHTTPHeaders: { blobContentType: file.type } };
  await blobClient.uploadBrowserData(file, options);
  // await blobClient.setMetadata({ UserName: "shubham" });
};

const uploadedLayersHandler = async ({
  layerInfo,
  fileSelected,
  appContext,
  loading,
  toggleXYForm,
}) => {
  return new Promise((resolve, reject) => {
      let XYFeatures = []
    const {
      fileName,
      uploadName,
      fileType,
      XYColumns,
      xField,
      yField,
    } = layerInfo
    const { map, view, widgets, sendMessage} = appContext
    const layersHandler = {
      // csv: ()=>csvLayerHandler(),
      json: () => geojsonLayerHandler(),
      geojson: () => geojsonLayerHandler(),
      kml: () => kmlLayerHandler(),
      kmz: () => kmlLayerHandler(),
      xls: () => XYLayerHandler(),
      xlsx: () => XYLayerHandler(),
      csv: () => XYLayerHandler(),
      txt: () => XYLayerHandler(),
      preparedLayer: () => addXYLayer(),
    };

    async function csvLayerHandler() {
      const uploadedFile = await uploadFileToBlob(fileSelected, uploadName);
      const csvLayer = new CSVLayer({ url: uploadedFile, title: fileName });
      addLayerToMap(csvLayer);
    }

    async function geojsonLayerHandler() {
      const uploadedFile = await uploadFileToBlob(fileSelected, uploadName);
      const geojsonLayer = new GeoJSONLayer({
        url: uploadedFile,
        title: fileName,
      });
      addLayerToMap(geojsonLayer);
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
          toggleXYForm(true, XYColumns);
        } else {
          sendMessage({
            type: "error",
            title: "رفع طبقة",
            body: `عفواً، فشلت عملية معالجة الملف الرجاء التأكد من صحة البيانات`,
          });
        }

      };

      // return new GeoJSONLayer({url: uploadedFile,title:fileName});
    }

    function addXYLayer() {
      const fields = [];
      const fieldInfos = [];
      const layerSource = [];
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
        title: "العنصر رقم {ObjectID}",
        content: [
          {
            type: "fields",
            fieldInfos: fieldInfos,
          },
        ],
      };
      fields.push({
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
    };

    const loadingTrigger = {
      loaded: () =>
        layerLoadingAction(
          "info",
          "إضافة طبقة",
          "تم إضافة الطبقة إلى الخريطة بنجاح"
        ),
      failed: () =>
        layerLoadingAction(
          "error",
          "إضافة طبقة",
          "عفواً، فشلت عملية إضافة الطبقة، تحقق من الرابط"
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

    try {
      resolve(layersHandler[fileType]());
    } catch (error) {
      reject(error);
    }
  });
}; // XYLayerHandle

export default uploadedLayersHandler;

export const allowedExtensions = [
  "csv",
  "txt",
  "xls",
  "xlsx",
  "zip",
  "txt",
  "json",
  "geojson",
  "kml",
  "kmz",
  "zip",
];
