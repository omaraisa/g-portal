/* 
send error msg
popup template
zoom
*/
import { useState, useRef, useContext } from "react";
import { AppContext } from "../../pages";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Graphic from "@arcgis/core/Graphic";

const supportedLayerTypes = ["csv", "feature", "geojson", "map-image"];

const allDataQuery = {
  outFields: ["*"],
  returnGeometry: true,
  where: "",
};

const symbols = {
  point: {
    type: "simple-marker",
    style: "circle",
    color: "#202020",
    size: "8px",
  },
  polyline: {
    type: "simple-line",
    color: "#202020",
    width: 2,
  },
  polygon: {
    type: "simple-fill",
    color: "#202020",
    outline: {
      width: 2,
      color: "#fff",
    },
  },
};

export default function IntersectionAnalysis() {
  const { map, view, layers, sendMessage } = useContext(AppContext);
  const [state, setState] = useState({
    firstLayer: null,
    secondLayer: null,
    geometryType: null,
  });
  const [firstLayerRef, secondLayerRef, sketchContainerRef, relationshipRef,stateRef] = [
    useRef(),
    useRef(),
    useRef(),
    useRef(),
    useRef(),
  ];
  stateRef.current = state;

  function setFirstLayer(state) {
    try {
      const layerIndex = firstLayerRef.current.value;
      const firstLayer = layers[layerIndex];
      const layer1Fields = firstLayer.fields;
  
      firstLayer.queryFeatures(allDataQuery).then(function (result) {
        setState({
          ...state,
          firstLayer,
          layer1Fields,
          firstLayerFeatures: result.features,
        });
      });
      
    } catch (error) {
      sendErrorMessage('فشل الحصول على بيانات الطبقة')
      console.log(error)
    }
  }

  function setSecondLayer(state) {
    try {
    const layerIndex = secondLayerRef.current.value;
    const secondLayer = layers[layerIndex];
    const layer2Fields = secondLayer.fields;
    const antiDuplicateFields =  layer2Fields.map(field => {
      field.name = field.name+"2"
      return field
    })

    secondLayer.queryFeatures(allDataQuery).then(function (result) {
      setState({
        ...state,
        secondLayer,
        layer2Fields:antiDuplicateFields,
        secondLayerFeatures: result.features,
      });
    });

  } catch (error) {
    sendErrorMessage('فشل الحصول على بيانات الطبقة')
    console.log(error)
  }
  }

  function analyze(state) {    
    const resultGraphics = getResultGraphics(state);
    Promise.all(resultGraphics).then((response) => {
      response.length
        ? addAnalysisResult({ response, state: stateRef.current })
        : sendErrorMessage("لا توجد نتيجة لهذا البحث")
    });
  }

  function addAnalysisResult({ response, state}) {
    
    const fields = [
      ...state.layer1Fields,
      ...state.layer2Fields,
      {
        name: "OBJECTID",
        alias: "OBJECTID",
        type: "oid",
      },
    ];

    const symbol = symbols[stateRef.current.geometryType];
    symbol.color = "#" + Math.floor(Math.random() * 16777215).toString(16)
    const renderer = {
      type: "simple",
      symbol,
    };

    const fieldInfos = fields.map(field => ({fieldName: field.name}))

  let intersectionLayerPopup = {
      title: "التقاطع رقم {ObjectID}",
      content: [{
          type: "fields",
          fieldInfos
      }]
  }
    const resultLayerParameters = {
      title: `${state.firstLayer.title}_${state.secondLayer.title}_تقاطع`,
      source: response,
      popupEnabled: true,
      popupTemplate: intersectionLayerPopup,
      outFields: ["*"],
      objectIdField : "OBJECTID",
      geometryType : stateRef.current.geometryType,
      spatialReference: state.firstLayer.spatialReference,
      fields,renderer
    }
    const intersectionLayer = new FeatureLayer(resultLayerParameters);
    
    map.layers.add(intersectionLayer);
    intersectionLayer.queryExtent().then(function (result) {
      view.goTo(result.extent);
      sendMessage({
        type: "info",
        title: "تحليل التقاطع",
        body: `اكتملت عملية التحليل وتمت إضافة الطبقة ${state.firstLayer.title}_${state.secondLayer.title}_تقاطع`,
      });
      
      setState({...state,intersectionLayer});
    });
  }

  function getResultGraphics(state) {
    const resultGraphics = [];
    let geometryType;    
    let objectID = 0;

    try {
    state.firstLayerFeatures.forEach((firstFeature) => {
      state.secondLayerFeatures.forEach((secondFeature) => {
        let intersectionGeom = geometryEngine.intersect(
          firstFeature.geometry,
          secondFeature.geometry
        );

        if (intersectionGeom) {
          const attributes = { ...firstFeature.attributes };
          for (const [key, value] of Object.entries(secondFeature.attributes)) {
            attributes[key + "2"] = value;
          }
          attributes["OBJECTID"] = objectID;
          objectID++;

          const intersectionGraphic = new Graphic({
            geometry: intersectionGeom,
            attributes: attributes,
          });
          resultGraphics.push(intersectionGraphic);
          geometryType = intersectionGeom.type;
        }
      });
    });
  } catch (error) {
    sendErrorMessage('فشلت العملية، هنالك مشكلة في البيانات المدخلة')
    console.log(error)
  }
    setState({...state,geometryType})
    return resultGraphics
  }

  function sendErrorMessage(errorMessage) {
    sendMessage({
      type: "error",
      title: "خطأ في عملية التقاطع",
      body: errorMessage,
    });
  }


  function listSupportedLayers(layers) {
   const options = layers.map((layer, index) => {
      if (supportedLayerTypes.includes(layer.type)) {
      return (
        <option key={layer.id} value={index}>
          {layer.title}
        </option>
      );
      }
    })
    return options
  }


  return (
    <div className="flex-column-container">
      <h3>تحليل التقاطع Intersection</h3>

      <label htmlFor="firstLayerRef">الطبقة الأولى</label>
      <select
        ref={firstLayerRef}
        id="firstLayerRef"
        className="select"
        onChange={() => setFirstLayer(state)}
      >
        <option value="" hidden>
          اختر
        </option>
        {listSupportedLayers(layers)}
      </select>

      <label htmlFor="secondLayerRef">الطبقة الثانية</label>
      <select
        ref={secondLayerRef}
        id="secondLayerRef"
        className="select"
        onChange={() => setSecondLayer(state)}
      >
        <option value="" hidden>
          اختر
        </option>
        {listSupportedLayers(layers)}
      </select>
      <button
        className="button primaryBtn"
        onClick={() => analyze(state)}
        disabled={state.firstLayer && state.secondLayer ? false : true}
      >
        <i className="esri-icon-cursor-marquee"></i>
        &nbsp; بدء التحليل
      </button>
    </div>
  );
}
