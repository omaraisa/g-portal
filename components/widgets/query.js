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
  const { map, view, layers, widgets, sendMessage } = useContext(AppContext);
  const [state, setState] = useState({
    targetLayer: null,
    queryResultLayer: null,
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
    const currentLayer = state.layersArray[layerIndex];
    const fieldsNames = currentLayer.fields.map((field) => field.name);
    view.whenLayerView(currentLayer).then(function (targetLayer) {
      const fetchAllFeaturesQuery = {
        outFields: ["*"],
        returnGeometry: false,
        // where: "",
        geometry: targetLayer.layer.fullExtent,
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
  })
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
    const querySymbol = symbols[state.targetLayer.layer.geometryType];
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
    const fieldInfos = state.targetLayer.layer.fields.map((field) => {
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

    const fields = state.targetLayer.layer.fields;
    if (!fields.some((field) => field.type === "oid")) {
      fields.unshift({
        name: "ObjectID",
        type: "oid",
      });
    }

    const queryResultLayer = new FeatureLayer({
      title: state.targetLayer.layer.title + " نتيجة بحث",
      geometryType: state.targetLayer.layer.geometryType,
      spatialReference: state.targetLayer.layer.spatialReference,
      popupEnabled: true,
      source,
      fields,
      renderer,
      popupTemplate,
    });

    map.add(queryResultLayer);
    widgets["legend"].layerInfos.push({
      layer: queryResultLayer,
    });
    queryResultLayer.queryExtent().then(function (result) {
      view.goTo(result.extent);
      sendMessage({
        type: "info",
        title: "البحث والاستعلام",
        body: `اكتملت عملية البحث على طبقة ${state.targetLayer.layer.title}`,
      });
      const layersArray = [...map.layers.items];
      setState({
        ...state,
        layersArray,queryResultLayer,
        queryResult: response.features,
        downloadBtnDisabled: false,
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
    const geometryType = state.targetLayer.layer.geometryType;
    const features = state.queryResult.map((feature) => {
      const geometryGetter = {
        point: () => getPointGeom(),
        polygon: () => getPolygonGeom(),
        polyline: () => getlineGeom(),
      };

      function getPointGeom() {
        return feature.geometry.coordinates
          ? {
              coordinates: feature.geometry.coordinates,
              geometry: "MultiPoint",
            }
          : {
              coordinates: [
                feature.geometry.longitude,
                feature.geometry.latitude,
              ],
              geometry: "Point",
            };
      }
      function getPolygonGeom() {
        return {
          coordinates: feature.geometry.rings,
          geometry:
            feature.geometry.rings.length > 1 ? "MultiPolygon" : "Polygon",
        };
      }

      function getlineGeom() {
        return {
          coordinates: feature.geometry.paths,
          geometry:
            feature.geometry.paths.length > 1
              ? "MultiLineString"
              : "LineString",
        };
      }

      return {
        type: "Feature",
        properties: feature.attributes,
        geometry: {
          type: geometryGetter[geometryType]().geometry,
          coordinates: geometryGetter[geometryType]().coordinates,
        },
      };
    });

    const geojsonQueryResult = {
      type: "FeatureCollection",
      features: features,
    };

    const fileName = state.targetLayer.layer.title;
    const geojson = JSON.stringify(geojsonQueryResult);
    const blob = new Blob([geojson], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = fileName + ".geojson";
    link.key =
      Math.floor(new Date().getTime()) + Math.floor(Math.random() * 999);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function clearSearch(state) {
    map.remove(state.queryResultLayer)
    setState({...state,
      queryResultLayer: null,
      downloadBtnDisabled: true,
      allFeatures: [],
    })
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
