import { useState, useRef, useContext, useEffect } from "react";
import { AppContext } from "../../pages";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";
import Sketch from "@arcgis/core/widgets/Sketch";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import * as GIS from "../../modules/gis-module";

let sketchGraphic = new GraphicsLayer({
  title: "طبقة الرسم",
  listMode: "hide",
});


export default function SelectFeatures() {
  const { map, view, layers, sendMessage, updateTargetLayers, goToSubMenu } = useContext(AppContext);
  const [
    targetLayerRef,
    selectionLayerRef,
    sketchContainerRef,
    relationshipRef,
  ] = [useRef(), useRef(), useRef(), useRef()];
  const defaultState = {
    targetLayer: null,
    selectionLayer: null,
    selectionResultLayer: null,
    resultFeatures: null,
    resultLayerParameters:null,
    interactiveSelectionActive: true,
    sketchInitialized: false,
  };
  const [state, setState] = useState(defaultState);
  const stateRef = useRef();
  stateRef.current = state;

  useEffect(() => {
    if (view && !state.sketchInitialized) {
      let sketch = new Sketch({
        layer: sketchGraphic,
        container:sketchContainerRef.current,
        view,
        availableCreateTools: ["polygon", "rectangle", "circle"],
        creationMode: "single",
        visibleElements : {
          selectionTools:{
            "rectangle-selection":false,
            "lasso-selection": false
          },
          settingsMenu: false
        }
      });
      sketch.on("create", ({ graphic, state }) => {
        if (state === "complete") {
          runQuery({ 
            geometry: graphic.geometry,
            spatialRelationship: "intersects",
            state: stateRef.current,
          });
        }
      });
      setState({ ...stateRef.current, sketchInitialized: true });
    }
  }, [state]);

  function toggleInteractiveSelection(state) {
    setState({
      ...state,
      interactiveSelectionActive: !state.interactiveSelectionActive,
    });
  }

  function setTargetLayer(state) {
    const layerIndex = targetLayerRef.current.value;
    const targetLayer = layers[layerIndex];
    setState({ ...state, targetLayer })
  }

  function setSelectionLayer(state) {
    try {
      const layerIndex = selectionLayerRef.current.value;
      const selectedLayer = layers[layerIndex];
      selectedLayer.queryFeatures(GIS.allDataQuery).then(function (result) {

        result.features.length
        ? getSelectionGeometry()
        : sendErrorMessage("لا توجد معالم في هذه الطبقة");

        function getSelectionGeometry() {
          const allFeaturesGeometries = result.features.map(
            (feature) => feature.geometry
          );
          const selectionGeometry = geometryEngine.union(allFeaturesGeometries);
          setState({ ...state, selectionGeometry, selectionLayer:selectedLayer });
        }

      });
    } catch (error) {
      sendErrorMessage("فشل الحصول على بيانات طبقة التحديد");
      console.log(error);
    }
  }
  
  function getQueryResult(geometry, spatialRelationship, state) {
    const query = {
      outFields: ["*"],
      geometry: geometry,
      returnGeometry: true,
        spatialRelationship,
      };
      return state.targetLayer
      .queryFeatures(query)
      .then((response) => {        
          return response.features})
        .catch((error) => {
          sendErrorMessage("حدث خطأ أثناء البحث الرجاء المحاولة مرة أخرى");
          console.log("Query Error", error);
          return;
        });
  }

  function runQuery({ geometry, spatialRelationship, state }) {
    if(!targetLayerRef.current.value)
    {
      sendErrorMessage("الرجاء إكمال الحقول المطلوبة")
      return
    }
    const resultFeatures = getQueryResult(
      geometry,
      spatialRelationship,
      state
    );
    
    Promise.all([resultFeatures]).then((response) => {
      const resultFeatures = [].concat(...response);
      resultFeatures.length
        ? addQueryResult({ resultFeatures, state: stateRef.current })
        : sendErrorMessage("لا توجد نتيجة لهذا البحث");
    });
  }

  function getUniqueFeatures(allFeatures) {
    const uniqueFeatures = [];
    allFeatures.forEach((feature) => {
      const isDuplicate = uniqueFeatures.some((uniqueFeature) => {
        return geometryEngine.equals(feature.geometry, uniqueFeature.geometry);
      });
      if (!isDuplicate) {
        uniqueFeatures.push(feature);
      }
    });
    return uniqueFeatures;
  }

  function addQueryResult({ resultFeatures, state }) {
    const {title,fields,geometryType,spatialReference,popupTemplate} = state.targetLayer
    
    if (state.selectionResultLayer) {
      map.remove(state.selectionResultLayer);
      setState({ ...state, selectionResultLayer: null });
    }
    const uniqueFeatures = getUniqueFeatures(resultFeatures);
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
    const querySymbol = symbols[geometryType];

    const renderer = {
      type: "simple",
      symbol: querySymbol,
    };

    const source = uniqueFeatures.map((feature) => {
      const queryGraphic = new Graphic({
        geometry: feature.geometry,
        attributes: feature.attributes,
        symbol: querySymbol,
      });
      // view.graphics.add(queryGraphic)
      return queryGraphic;
    });

    
    if (!fields.some((field) => field.type === "oid")) {
      fields.unshift({
        name: "ObjectID",
        type: "oid",
      });
    }
    const resultLayerParameters = {
      title: title + " نتيجة تحديد",
      geometryType: geometryType,
      spatialReference: spatialReference,
      popupTemplate: popupTemplate,
      popupEnabled: true,
      fields,
      renderer,
      source,
    }
    const selectionResultLayer = new FeatureLayer(resultLayerParameters);

    map.layers.add(selectionResultLayer);
    selectionResultLayer.queryExtent().then(function (result) {
      view.goTo(result.extent).then(() => {
        sendMessage({
          type: "info",
          title: "البحث والاستعلام",
          body: `اكتملت عملية البحث على طبقة ${title}`,
        });
        setState({
          ...state,
          selectionResultLayer,
          resultLayerParameters,
          resultFeatures: uniqueFeatures,
        });
      });
    });
  }

  function sendErrorMessage(errorMessage) {
    sendMessage({
      type: "error",
      title: "خطأ في عملية التحديد",
      body: errorMessage,
    });
  }

  function startSelection(state) {
    // wait for all layerviews to be generated disable search button
    const spatialRelationship = relationshipRef.current.value;
    
    runQuery({ geometry:state.selectionGeometry, spatialRelationship, state })
    }

  function stopSelection(state) {
    if (state.selectionResultLayer) {
      map.layers.remove(state.selectionResultLayer);
      setState({ ...state, resultFeatures: null, selectionResultLayer: null });
    }
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
    const newSymbol = symbols[state.selectionResultLayer.geometryType];

    const renderer = {
      type: "simple",
      symbol: newSymbol,
    };
    
    const newSelectionLayer = new FeatureLayer(state.resultLayerParameters);
    newSelectionLayer.title = state.targetLayer.title+ "_نسخة معدلة"
    newSelectionLayer.renderer = renderer
    map.layers.add(newSelectionLayer)
  }


  async function downloadQueryResult(state) {
    updateTargetLayers({ exportingTargetLayer: state.selectionResultLayer });
    goToSubMenu("ExportManager");
  }

  // useEffect(() => console.log(state), [state]);

  return (
    <div className="flex-column-container">
      <h3>تحديد المعالم Selection</h3>

      <label htmlFor="targetLayerRef">الطبقة المستهدفة</label>
      <select
        ref={targetLayerRef}
        id="targetLayerRef"
        className="select"
        onChange={() => setTargetLayer(state)}
      >
        <option value="" hidden>
          اختر
        </option>
        {layers.map((layer, index) => {
          return (
            <option key={layer.id} value={index}>
              {layer.title}
            </option>
          );
        })}
      </select>

      <div className="flex-row-container">
        <input
          type="checkbox"
          checked={state.interactiveSelectionActive}
          onChange={() => toggleInteractiveSelection(state)}
          className="checkbox"
          id="mapSelectionCheckBock"
        ></input>
        <label className="tick-label" htmlFor="mapSelectionCheckBock">
          <div id="tick_mark"></div>
        </label>
        <label htmlFor="mapSelectionCheckBock">التحديد من الخريطة</label>
      </div>

      <div className="flex-row-container">
        <input
          type="checkbox"
          checked={!state.interactiveSelectionActive}
          onChange={() => toggleInteractiveSelection(state)}
          className="checkbox"
          id="layerSelectionCheckBock"
        ></input>
        <label className="tick-label" htmlFor="layerSelectionCheckBock">
          <div id="tick_mark"></div>
        </label>
        <label htmlFor="layerSelectionCheckBock">التحديد عبر طبقة أخرى</label>
      </div>

      <div
        key="interactiveSelection"
        className="flex-column-container"
        ref={sketchContainerRef}
        style={{
          display: state.interactiveSelectionActive ? "flex" : "none",
        }}
      ></div>

      <div
        key="layerSelection"
        className="flex-column-container"
        style={{
          display: state.interactiveSelectionActive ? "none" : "flex",
        }}
      >
        <label htmlFor="selectionLayerRef">التحديد عبر طبقة أخرى</label>
        <select
          ref={selectionLayerRef}
          id="selectionLayerRef"
          className="select"
          onChange={() => setSelectionLayer(state)}
        >
          <option value="" hidden>
            اختر
          </option>
          {layers.map((layer, index) => {
            return (
              <option key={layer.id} value={index}>
                {layer.title}
              </option>
            );
          })}
        </select>

        <label htmlFor="selectionCondition">شرط التحديد</label>
        <span style={{ fontSize: "1.2rem" }}>
          مثال: الطبقة المستهدفة تحتوي الطبقة الأخرى
        </span>
        <select
          className="select"
          id="selectionCondition"
          ref={relationshipRef}
          defaultValue={"intersects"}
        >
          <option value="intersects">تتقاطع Intersects</option>
          <option value="contains">تحتوي Contains</option>
          <option value="touches">تلامس Touches</option>
          <option value="within">ضمن Within</option>
          <option value="disjoint">تختلف Disjoint</option>
        </select>

        <button
          className="button primaryBtn"
          onClick={() => startSelection(state)}
          // disabled= {state.selectionLayerView && state.targetLayer? false : true}
        >
          <i className="esri-icon-cursor-marquee"></i>
          &nbsp; بدء التحديد
        </button>
      </div>

      <button
        className="button primaryBtn"
        onClick={() => stopSelection(state)}
      >
        <i className="esri-icon-close"></i>
        &nbsp; الغاء التحديد
      </button>
      <button
        className="button primaryBtn"
        disabled={state.selectionResultLayer ? false : true}
        onClick={() => CreateSeparateLayer(state)}
      >
        إنشاء طبقة جديدة
      </button>
      <button
        className="button successBtn"
        disabled={state.selectionResultLayer ? false : true}
        onClick={() => downloadQueryResult(state)}
      >
        تحميل النتيجة
      </button>
    </div>
  );
}
