import { useState, useRef, useContext, useEffect } from "react";
import { AppContext } from "../../pages";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Graphic from "@arcgis/core/Graphic";
import * as GIS from "../../modules/gis-module";

export default function StatisticalAnalysis() {
  const [
    layerSelector,
    fieldSelector,
    statisticType,
    extentRef,
  ] = [useRef(), useRef(), useRef(), useRef()];
  const { map, view, layers, widgets, sendMessage, goToSubMenu } = useContext(AppContext);
  const [state, setState] = useState({
    targetLayer: null,
    statisticsResult: null,
    fieldsNames: [],
    layersArray: [],
    allFeatures: [],
    downloadBtnDisabled: true,
    activeListener: false,
  });
  const supportedLayerTypes = ["csv", "feature", "geojson"];

  useEffect(() => {
          setState({ ...state, layersArray:layers, activeListener: true });
  }, [layers]);

  function prepareQueryParams(state) {
    const layerIndex = layerSelector.current.value;
    const targetLayer = state.layersArray[layerIndex];
    const fieldsNames = targetLayer.fields.map((field) => field.name);
      targetLayer.queryFeatures(GIS.allDataQuery).then(function (result) {
      setState({
        ...state,
        targetLayer,
        fieldsNames,
        allFeatures: result.features,
      });
    }).catch((error) => {
      sendErrorMessage("تعذر جمع البيانات عن الطبقة المختارة");
      console.log("Query Error", error);
    });
  }


  function runAnalysis(state) {
    const queryParams = {
      queryField: fieldSelector.current.value,
      statisticType: statisticType.current.value,
      extent: extentRef.current.value,
    };
    const outputField = queryParams.statisticType.toUpperCase() + "_" + queryParams.queryField

    const queryIsValid = Object.values(queryParams).every((parameter) => {
      if (parameter !== null && parameter !== undefined) return true;
      return false;
    });

    queryIsValid
      ? applyQuery()
      : sendErrorMessage("الرجاء تكملة متطلبات العملية");

    function applyQuery() {
     
      const query = {
        outStatistics: {
          onStatisticField: queryParams.queryField,
          statisticType: queryParams.statisticType
        }
      };
      if(queryParams.extent === "view")
      query.geometry = view.extent

      state.targetLayer
        .queryFeatures(query)
        .then(function (response) {
          const statisticsResult = Object.values(response.features[0].attributes)[0]
          setState({...state,statisticsResult:statisticsResult })
        })
        .catch((error) => {
          sendErrorMessage("حدث خطأ أثناء العملية الرجاء المحاولة مرة أخرى");
          console.log("Query Error", error);
        });
    }
  }

  function sendErrorMessage(errorMessage) {
    sendMessage({
      type: "error",
      title: "خطأ في التحليل الاحصائي",
      body: errorMessage,
    });
  }


  function clearResult(state) {
    setState({...state,statisticsResult:null})
  }


  return (
    <div className="flex-column-container">
       <span className="info-text">يمكنك تحديد جزء من البيانات للتحليل</span> 
      <button
        className="button secondaryBtn rightBtn"
        onClick={() => goToSubMenu("SelectFeatures")}
      >
        <i className="esri-icon-cursor-marquee"></i>
        تحديد المعالم
      </button>
      {state.statisticsResult !== null && state.statisticsResult !== "" &&
      <div className="flex-column-container" style={{backgroundColor:"#b3dd9a"}}>
      <b>النتيجة</b>
      <span style={{textAlign:"center",fontSize:"2rem",fontWeight:"bolder"}}>{state.statisticsResult}</span>
      </div>
    }
      <label htmlFor="layerSelector">اختر الطبقة</label>
      <select
        ref={layerSelector}
        id="layerSelector"
        className="select"
        onChange={() => prepareQueryParams(state)}
      >
        <option value="" hidden>
          اختر
        </option>
        {GIS.listSupportedLayers(layers)}
      </select>

      <label htmlFor="fieldSelector">حدد الحقل</label>
      <select ref={fieldSelector} id="fieldSelector" className="select">
        <option value="" hidden>
          اختر
        </option>
        {state.fieldsNames.map((fieldName, index) => {
          return (
            <option key={index} value={fieldName}>
              {fieldName}
            </option>
          );
        })}
      </select>

      <label htmlFor="statisticType">نوع العملية الاحصائية</label>
      <select ref={statisticType} id="statisticType" className="select">
        <option value="" hidden>
          اختر
        </option>
        <option value="count">count</option>
        <option value="sum">sum</option>
        <option value="min">min</option>
        <option value="max">max</option>
        <option value="avg">avg</option>
      </select>

      <label htmlFor="extentRef">نطاق التحليل Extent</label>
      <select ref={extentRef} id="extentRef" className="select">
        <option value="" hidden>
          اختر
        </option>
        <option value="layer">كامل الطبقة</option>
        <option value="view">نطاق نافذة العرض</option>
      </select>

      <button className="button primaryBtn" onClick={() => runAnalysis(state)}>
        تحليل
      </button>
    
      <button className="button primaryBtn" onClick={() => clearResult(state)}>إلغاء التحليل</button>
      
    </div>
  );
}
