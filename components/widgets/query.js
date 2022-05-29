import { useState, useRef, useContext, useEffect } from "react";
import { AppContext } from "../../pages";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Graphic from "@arcgis/core/Graphic";

export default function Query() {
  const [
    layerSelector,
    fieldSelector,
    operatorSelector,
    inputTypeSelector,
    insertedQueryValue,
    selectedQueryValue,
  ] = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const { map, view, layers, widgets, sendMessage, updateTargetLayers, goToSubMenu} = useContext(AppContext);
  const [state, setState] = useState({
    targetLayer: null,
    queryResultLayer: null,
    resultLayerParameters:null,
    fieldsNames: [],
    layersArray: [],
    inputMethod: "manual",
    downloadBtnDisabled: true,
    allFeatures: [],
    activeListener: false,
  });
  const supportedLayerTypes = ["csv", "feature", "geojson", "map-image"];

  useEffect(() => {
          setState({ ...state, layersArray:layers, activeListener: true });
  }, [layers]);

  function prepareQueryParams(state) {
    const layerIndex = layerSelector.current.value;
    const targetLayer = state.layersArray[layerIndex];
    const fieldsNames = targetLayer.fields.map((field) => field.name);
    const fetchAllFeaturesQuery = {
      outFields: ["*"],
      returnGeometry: false,
      where: "",
    };
      targetLayer.queryFeatures(fetchAllFeaturesQuery).then(function (result) {
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

  function toggleInputMode(state, mode) {
    setState({ ...state, inputMethod: mode });
  }

  function search(state) {
    const queryParams = {
      queryField: fieldSelector.current.value,
      queryOperator: operatorSelector.current.value,
    };
    let queryValue =
      state.inputMethod === "manual"
        ? insertedQueryValue.current.value
        : selectedQueryValue.current.value;
    if (!Number(queryValue)) queryValue = "'" + queryValue + "'";

    const queryIsValid = Object.values(queryParams).every((parameter) => {
      if (parameter !== null && parameter !== undefined) return true;
      return false;
    });

    queryIsValid
      ? applyQuery()
      : sendErrorMessage("الرجاء تكملة متطلبات البحث");

    function applyQuery() {
      if(state.queryResultLayer) map.remove(state.queryResultLayer)
      const queryExpression =
      queryParams.queryField + queryParams.queryOperator + queryValue;
      const query = {
        outFields: ["*"],
        returnGeometry: true,
        where: queryExpression,
      };

      state.targetLayer
        .queryFeatures(query)
        .then(function (response) {
          response.features.length
            ? addQueryResult(response)
            : sendErrorMessage("لا توجد نتيجة لهذا البحث");
        })
        .catch((error) => {
          sendErrorMessage("حدث خطأ أثناء البحث الرجاء المحاولة مرة أخرى");
          console.log("Query Error", error);
        });
    }
  }
  function addQueryResult(response) {
    const symbols = {
      point: {
        type: "simple-marker",
        style: "circle",
        color: "rgba(0,255,255,1)",
        size: "8px",
      },
      polyline: {
        type: "simple-line",
        color: "rgba(0,255,255,1)",
        width: 3,
      },
      polygon: {
        type: "simple-fill",
        color: "rgba(255,255,255,0)",
        outline: {
          width: 2,
          color: "rgba(0,255,255,1)",
        },
      },
    };
    const querySymbol = symbols[state.targetLayer.geometryType];
    const renderer = {
      type: "simple",
      symbol: querySymbol,
    };

    const source = response.features.map((feature) => {
      const queryGraphic = new Graphic({
        geometry: feature.geometry,
        attributes: feature.attributes,
        symbol: querySymbol,
      });
      return queryGraphic;
    });
    const fieldInfos = state.targetLayer.fields.map((field) => {
      return { fieldName: field.name };
    });

    const popupTemplate = {
      content: [
        {
          type: "fields",
          fieldInfos: fieldInfos,
        },
      ],
    };

    const fields = state.targetLayer.fields;
    if (!fields.some((field) => field.type === "oid")) {
      fields.unshift({
        name: "ObjectID",
        type: "oid",
      });
    }
    const resultLayerParameters = {
      title: state.targetLayer.title + " نتيجة بحث",
      geometryType: state.targetLayer.geometryType,
      spatialReference: state.targetLayer.spatialReference,
      popupEnabled: true,
      source,
      fields,
      renderer,
      popupTemplate,
    } 
    const queryResultLayer = new FeatureLayer(resultLayerParameters);

    map.add(queryResultLayer);
    widgets["legend"].layerInfos.push({
      layer: queryResultLayer,
    });
    queryResultLayer.queryExtent().then(function (result) {
      view.goTo(result.extent);
      sendMessage({
        type: "info",
        title: "البحث والاستعلام",
        body: `اكتملت عملية البحث على طبقة ${state.targetLayer.title}`,
      });
      const layersArray = [...map.layers.items];
      setState({
        ...state,
        layersArray,queryResultLayer,
        queryResult: response.features,
        downloadBtnDisabled: false,
        resultLayerParameters
      });
    });
  }

  function sendErrorMessage(errorMessage) {
    sendMessage({
      type: "error",
      title: "خطأ في البحث والاستعلام",
      body: errorMessage,
    });
  }

  async function downloadQueryResult(state) {
    updateTargetLayers({ exportingTargetLayer: state.queryResultLayer });
    goToSubMenu("ExportManager");
  }

  function clearSearch(state) {
    map.remove(state.queryResultLayer)
    setState({...state,
      queryResultLayer: null,
      downloadBtnDisabled: true,
      allFeatures: [],
    })
  }

  function CreateSeparateLayer(state) {
    const randomColor = "#" + Math.floor(Math.random() * 16777215).toString(16)
    const symbols = {
      point: {
        type: "simple-marker",
        style: "circle",
        color: randomColor,
        size: "8px",
      },
      polyline: {
        type: "simple-line",
        color: randomColor,
        width: 2,
      },
      polygon: {
        type: "simple-fill",
        color: randomColor,
        outline: {
          width: 2,
          color: "#fff",
        },
      },
    };
    const newSymbol = symbols[state.targetLayer.geometryType];

    const renderer = {
      type: "simple",
      symbol: newSymbol,
    };
    
    const newSelectionLayer = new FeatureLayer(state.resultLayerParameters);
    newSelectionLayer.title = state.targetLayer.title+ "_نسخة معدلة"
    newSelectionLayer.renderer = renderer
    map.layers.add(newSelectionLayer)
  }

  return (
    <div className="flex-column-container">
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
        {state.layersArray.map((layer, index) => {
          if (supportedLayerTypes.includes(layer.type)) {
            return (
              <option key={layer.id} value={index}>
                {layer.title}
              </option>
            );
          }
        })}
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

      <label htmlFor="operatorSelector">حدد شرط الاستعلام</label>
      <select ref={operatorSelector} id="operatorSelector" className="select">
        <option value="" hidden>
          اختر
        </option>
        <option value=">">أكبر من</option>
        <option value="<">أقل من</option>
        <option value="=">يساوي</option>
      </select>

      <label htmlFor="inputTypeSelector">حدد نوع الادخال</label>
      <select
        ref={inputTypeSelector}
        id="inputTypeSelector"
        onChange={() => toggleInputMode(state, inputTypeSelector.current.value)}
        className="select"
      >
        <option value={"manual"}>ادخال يدوي</option>
        <option value={"from data"}>من البيانات</option>
      </select>

      {state.inputMethod === "manual" ? (
        <div id="queryInputDiv" className="flex-column-container">
          <label htmlFor="queryInput">أدخل قيمة</label>
          <input
            ref={insertedQueryValue}
            type="text"
            id="queryInput"
            className="input-text"
          ></input>
        </div>
      ) : (
        <div id="queryValuesDiv" className="flex-column-container">
          <label htmlFor="queryValues">اختر قيمة</label>
          <select ref={selectedQueryValue} id="queryValues" className="select">
            <option value="" hidden>
              اختر
            </option>
            {state.allFeatures.map((feature, index) => {
              const targetField = fieldSelector.current.value;
              if (feature.attributes[targetField] !== null)
                return (
                  <option key={index} value={feature.attributes[targetField]}>
                    {feature.attributes[targetField]}
                  </option>
                );
            })}
          </select>
        </div>
      )}
      <button className="button primaryBtn" onClick={() => search(state)}>
        بحث
      </button>
      <button
        className="button primaryBtn"
        disabled={state.downloadBtnDisabled}
        onClick={() => CreateSeparateLayer(state)}
      >
        إنشاء طبقة جديدة
      </button>
      <button className="button primaryBtn" onClick={() => clearSearch(state)}>إلغاء البحث</button>
      <button
        className="button successBtn"
        disabled={state.downloadBtnDisabled}
        onClick={() => downloadQueryResult(state)}
      >
        تحميل النتيجة
      </button>
    </div>
  );
}
