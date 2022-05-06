import { useState, useRef, useEffect, useContext } from "react";
import { AppContext } from "../../pages";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Graphic from "@arcgis/core/Graphic";
import * as GIS from "../../modules/gis-module";
import styles from "../sub_components/loading.module.css";

export default function NearAnalysis() {
  const { map, view, layers, sendMessage } = useContext(AppContext);
  const [state, setState] = useState({
    layer1: null,
    layer2: null,
    geometryType: null,
    loading: false,
    layer2Fields: [],
  });
  const [objectIdFieldRef,measureUnitRef,uniqueFieldRef] = [useRef(),useRef(),useRef()]
  const stateRef = useRef();
  stateRef.current = state;
  const [loading, setLoading] = useState(false);

  function setLayer(state, event, layerOrder) {
    try {
      const layerIndex = event.target.value;
      const selectedLayer = layers[layerIndex];
      let selectedLayerFields = selectedLayer.fields;
      selectedLayer.queryFeatures(GIS.allDataQuery).then(function (result) {
        if (!result.features.length) {
          sendErrorMessage("لا توجد بيانات في هذه الطبقة");
          return;
        }
        const newState = { ...state };
        newState[`layer${layerOrder}`] = selectedLayer;
        newState[`layer${layerOrder}Fields`] = selectedLayerFields;
        newState[`layer${layerOrder}Features`] = result.features;
        newState[`layer${layerOrder}geometryType`] = selectedLayer.geometryType;
        setState(newState);
      });
    } catch (error) {
      sendErrorMessage("فشل الحصول على بيانات الطبقة");
      console.log(error);
    }
  }

  function analyze(state) {
      setLoading(true);
      const secondLayerCentroids = getCentroid(state);
      Promise.all(secondLayerCentroids).then((response) => {
        const newFeatures = handleCentroidsResult({
          secondLayerCentroids: response,
          state: stateRef.current,
        })
        Promise.all(newFeatures).then((response) => response.length? addAnalysisResult({newFeatures:response, state }):handleEmptyResult() );
      });
  }

  function handleEmptyResult() {
    sendErrorMessage("فشلت العملية، حدثت مشكلة في معالجة احداثيات الطبقة");
    setLoading(false);
  }

  function handleCentroidsResult({ secondLayerCentroids, state }) {
    let newFeatures = []
    try {
      const decimalToMetricConstant = measureUnitRef.current.value
      const uniqueField = uniqueFieldRef.current.value
      const objectID = objectIdFieldRef.current.value;
      const searchStartPoint = 999999999
      newFeatures = state.layer1Features.map((Layer1Feature) => {
        let distance = searchStartPoint;
        state.layer2Features.forEach((Layer2Feature) => {
          let near 
          state.layer1geometryType === "point"
          ? near = geometryEngine.nearestCoordinate(
            Layer2Feature.geometry,
            Layer1Feature.geometry
          )
          : near = geometryEngine.nearestCoordinate(
            Layer1Feature.geometry,
            Layer2Feature.geometry
          )
          if (near && near.distance < distance) {
            distance = near.distance;
            Layer1Feature.attributes["Distance"] = distance * decimalToMetricConstant
            Layer1Feature.attributes["NearID"] = Layer2Feature.attributes[objectID];
            Layer1Feature.attributes[uniqueField] = uniqueField? Layer2Feature.attributes[uniqueField] : ""
          }
        });
        return Layer1Feature
      });
      
    } catch (error) {
        console.log(error);
        setLoading(false);
      }
      return newFeatures
  }
  function addAnalysisResult({ newFeatures, state }) {
    try {
      const graphics = newFeatures.map(feature=> {
        return new Graphic({
           geometry: feature.geometry,
           attributes: feature.attributes,
         });
       })
       const fields = [
         ...state.layer1Fields,
         {
           name: "NearID",
           alias: "NearID",
           type: "double",
         },
         {
           name: "Distance",
           alias: "Distance",
           type: "double",
         },
       ];
       if(uniqueFieldRef.current.value){
         fields.push({
           name: uniqueFieldRef.current.value,
           alias: uniqueFieldRef.current.value,
           type: "string",
         },)
       }
   
       const symbol = GIS.symbols[state.layer1.geometryType];
       symbol.color = "#" + Math.floor(Math.random() * 16777215).toString(16);
       const renderer = {
         type: "simple",
         symbol,
       };
   
       const fieldInfos = fields.map((field) => ({ fieldName: field.name }));
   
       let nearLayerPopup = {
         content: [
           {
             type: "fields",
             fieldInfos,
           },
         ],
       };
   
       const nearLayer = new FeatureLayer({
         title: `${state.layer1.title}_${state.layer2.title}_أقرب معلم`,
         source: graphics,
         popupEnabled: true,
         popupTemplate: nearLayerPopup,
         outFields: ["*"],
         objectIdField: "OBJECTID",
         spatialReference: state.layer1.spatialReference,
         fields,
         renderer,
       });
   
       map.layers.add(nearLayer);
       nearLayer.queryExtent().then(function (result) {
         view.goTo(result.extent);
         sendMessage({
           type: "info",
           title: "تحليل القرب",
           body: `اكتملت عملية التحليل وتمت إضافة الطبقة ${nearLayer.title}`,
         });
         setLoading(false);
         setState({ ...state, nearLayer });
        });
      } catch (error) {
        sendErrorMessage("فشلت العملية، هنالك مشكلة في إنشاء الطبقة");
        console.log(error);
        setLoading(false);
    }
    
  }

  function getCentroid(state) {
    const centroids = [];
    try {
      state.layer2Features.forEach((feature) => {
        const centroid =
          state.layer2.geometryType === "point"
            ? feature.geometry
            : feature.geometry.centroid;
        const attributes = feature.attributes;
        centroids.push({ centroid, attributes });
      });
    } catch (error) {
      sendErrorMessage("فشلت العملية، هنالك مشكلة في البيانات المدخلة");
      console.log(error);
    }
    return centroids;
  }

  function sendErrorMessage(errorMessage) {
    sendMessage({
      type: "error",
      title: "خطأ في عملية أقرب معلم",
      body: errorMessage,
    });
  }

  function inputsCheck(state) {
    const inputsGeometries = [state.layer1geometryType,state.layer2geometryType]
    const inputsAreValid = inputsGeometries.some(input => input === "point")
    inputsAreValid
    ? analyze(state)
    : sendErrorMessage("عفواً يجب أن تكون احدى الطبقات من نوع نقاط")
  }

  // useEffect(_=> console.log((state)),[state])

  return (
    <div className="flex-column-container">
      <h3>تحليل أقرب معلم</h3>

      <label htmlFor="firstLayer">الطبقة المتسهدفة</label>
      <select
        id="firstLayer"
        className="select"
        onChange={(event) => setLayer(state, event, 1)}
      >
        <option value="" hidden>
          اختر
        </option>
        {GIS.listSupportedLayers(layers)}
      </select>

      <label htmlFor="secondLayer">الطبقة الثانية</label>
      <select
        id="secondLayer"
        className="select"
        onChange={(event) => setLayer(state, event, 2)}
      >
        <option value="" hidden>
          اختر
        </option>
        {GIS.listSupportedLayers(layers)}
      </select>

      <label htmlFor="queryValues"> حقل المفتاح ObjectID</label>
      <select ref={objectIdFieldRef} id="queryValues" className="select">
        <option value="" hidden>
          اختر
        </option>
        {state.layer2Fields.map((field, index) => {
          return (
            <option key={index} value={field.name}>
              {field.name}
            </option>
          );
        })}
      </select>

      <label htmlFor="uniqueField"> حقل مميز (مثل الاسم)</label>
      <select ref={uniqueFieldRef} id="uniqueField" className="select">
        <option value="" hidden>
          اختر
        </option>
        {state.layer2Fields.map((field, index) => {
          return (
            <option key={index} value={field.name}>
              {field.name}
            </option>
          );
        })}
      </select>


      <label htmlFor="measureUnit">اختر وحدة القياس</label>
      <select defaultValue={"111200"} ref={measureUnitRef} id="measureUnit" className="select">
        <option value="111200">متر</option>
        <option value="111.2">كيلومتر</option>
      </select>

      <button
        className="button primaryBtn"
        onClick={() => inputsCheck(state)}
        disabled={state.layer1 && state.layer2 && objectIdFieldRef.current.value && !loading ? false : true}
      >
        &nbsp; بدء التحليل
      </button>
      {loading && (
        <div className={styles.loadingDiv} style={{ height: "3rem" }}>
          <i
            className={`esri-icon-loading-indicator  ${styles.loadingIcon}`}
          ></i>
        </div>
      )}
    </div>
  );
}
