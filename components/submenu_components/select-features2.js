import { useState, useRef, useContext, useEffect } from "react";
import { AppContext } from "../../pages";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import LayerView from "@arcgis/core/views/layers/LayerView";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";
import Sketch from "@arcgis/core/widgets/Sketch";
// import Graphic from "@arcgis/core/Graphic";

let sketchGraphic = new GraphicsLayer({
  title: "طبقة الرسم",
});

let sketch = new Sketch({
  layer: sketchGraphic,
  availableCreateTools: ["rectangle-selection", "lasso-selection", "circle"],
  creationMode: "single",
});

export default function SelectFeatures() {
  const { map, view, layers, widgets, sendMessage } = useContext(AppContext);
  const [targetLayerRef, selectionLayerRef, sketchRef] = [
    useRef(),
    useRef(),
    useRef(),
  ];
  const defaultState = {
    targetLayer: null,
    selectionLayer: null,
    selectionResultLayer: null,
    interactiveSelectionActive: true,
  };
  const [state, setState] = useState(defaultState);
  const [sketchState, setSketchState] = useState({});

  useEffect(() => {
    if(view)
    {
    sketch.container = sketchRef.current;
    sketch.view = view;
    }
    // sketch.render();    
  }, [state.interactiveSelectionActive]);

  function toggleInteractiveSelection(state) {
    setState({
      ...state,
      interactiveSelectionActive: !state.interactiveSelectionActive,
    });
  }

  function runQuery({graphic}) {
    const layerIndex = targetLayerRef.current.value;
    const targetLayer = layers[layerIndex];
    view.whenLayerView(targetLayer).then(function (layerView) {
      const query = {
        outFields: ["*"],
        geometry: graphic.geometry,
        returnGeometry: true,
        // geometry:  layerView.layer.fullExtent,
    };
    layerView
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
  });
}

function addQueryResult(response) {
    console.log("response",response);
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
    // const querySymbol = symbols[state.targetLayer.geometryType];
    const querySymbol = symbols["polygon"];

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

    // const fields = state.targetLayer.fields;
    const fields = [];
    if (!fields.some((field) => field.type === "oid")) {
      fields.unshift({
        name: "ObjectID",
        type: "oid",
      });
    }

    const selectionResultLayer = new FeatureLayer({
      // title: state.targetLayer.title + " نتيجة تحديد",
      geometryType: "polygon",
      // spatialReference: state.targetLayer.spatialReference,
      // popupTemplate: state.targetLayer.popupTemplate,
      // popupEnabled: true,
      fields,
      renderer,
      source,
    });

    map.add(selectionResultLayer);
    widgets["legend"].layerInfos.push({
      layer: selectionResultLayer,
    });
    selectionResultLayer.queryExtent().then(function (result) {
      view.goTo(result.extent);
      sendMessage({
        type: "info",
        title: "البحث والاستعلام",
        body: `اكتملت عملية البحث على طبقة ${state.targetLayer.title}`,
      });
      setState({
        ...state,
        selectionResultLayer,
        queryResult: response.features,
        downloadBtnDisabled: false,
      });
    });
  }

  function startSelection() {}
  function stopSelection() {
    let sketchGraphic2 = new GraphicsLayer({
      title: "طبقة الرسم",
    });
    
    let sketch2 = new Sketch({
      layer: sketchGraphic2,
      availableCreateTools: ["rectangle-selection", "lasso-selection", "circle"],
      creationMode: "single",
      view,
    });
    view.ui.add(sketch2, 'bottom-left')
    
    // const targetLayer = state.theLayer
    const targetLayer = layers[0]
    sketch2.on("create", ({ graphic, state }) => {
      if (state === "complete")
      {
        view.whenLayerView(targetLayer).then(function (layerView) {
          const query = {
            outFields: ["*"],
            geometry: graphic.geometry,
            returnGeometry: true,
            // geometry:  layerView.layer.fullExtent,
        };
        layerView
        .queryFeatures(query)
        .then(function (response) {
          response.features.length
          ? addQueryResult2(response)
          : sendErrorMessage("لا توجد نتيجة لهذا البحث");
        })
        .catch((error) => {
          sendErrorMessage("حدث خطأ أثناء البحث الرجاء المحاولة مرة أخرى");
          console.log("Query Error", error);
        });
      });
      }
    });

    
function addQueryResult2(response) {
  console.log("response",response);
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
  // const querySymbol = symbols[state.targetLayer.geometryType];
  const querySymbol = symbols["polygon"];

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

  // const fields = state.targetLayer.fields;
  const fields = [];
  if (!fields.some((field) => field.type === "oid")) {
    fields.unshift({
      name: "ObjectID",
      type: "oid",
    });
  }

  const selectionResultLayer = new FeatureLayer({
    // title: state.targetLayer.title + " نتيجة تحديد",
    geometryType: "polygon",
    // spatialReference: state.targetLayer.spatialReference,
    // popupTemplate: state.targetLayer.popupTemplate,
    // popupEnabled: true,
    fields,
    renderer,
    source,
  });

  map.add(selectionResultLayer);
  widgets["legend"].layerInfos.push({
    layer: selectionResultLayer,
  });
  selectionResultLayer.queryExtent().then(function (result) {
    view.goTo(result.extent);
    sendMessage({
      type: "info",
      title: "البحث والاستعلام",
      body: `اكتملت عملية البحث على طبقة ${sketchState.theLayer.title}`,
    });
    setState({
      ...state,
      selectionResultLayer,
      queryResult: response.features,
      downloadBtnDisabled: false,
    });
  });
}

  }

  function initiateQuery() {}

  function setTargetLayer() {
    const layerIndex = targetLayerRef.current.value;
    const targetLayer = layers[layerIndex];
    console.log(targetLayer)
    setState({ ...state, targetLayer});
    sketch.on("create", ({ graphic, state }) => {
      if (state === "complete") runQuery({graphic});
    });
  }

  function setSelectionLayer(state) {
    const layerIndex = selectionLayerRef.current.value;
    const selectionLayer = layers[layerIndex];
    const selectionLayerView = new LayerView({ layer: selectionLayer });
    setState({ ...state, selectionLayer: selectionLayerView });
  }

  function sendErrorMessage(errorMessage) {
    sendMessage({
      type: "error",
      title: "خطأ في عملية التحديد",
      body: errorMessage,
    });
  }

  // useEffect(() => console.log(state), [state]);
  useEffect(() => {
    setSketchState({...sketchState, theLayer:layers[0]}) 
    console.log(sketchState)
  }, [state]);

  return (
    <div className="flex-column-container">
      <h3>تحديد المعالم Selection</h3>

      <label htmlFor="targetLayerRef">الطبقة المستهدفة</label>
      <select
        ref={targetLayerRef}
        id="targetLayerRef"
        className="select"
        onChange={() => setTargetLayer()}
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
        ref={sketchRef}
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
          {layers.map((layer) => {
            return (
              <option key={layer.id} value={layer.id}>
                {layer.title}
              </option>
            );
          })}
        </select>

        <label htmlFor="selectionCondition">شرط التحديد</label>
        <select className="select" id="selectionCondition">
          {/* <option value="" hidden>اختر</option> */}
          <option value="intersect">التقاطع Intersection</option>
          <option value="2">Option 2</option>
          <option value="3">Option 3</option>
          <option value="4">Option 4</option>
          <option value="5">Option 5</option>
        </select>

        <button className="button primaryBtn" onClick={() => startSelection()}>
          <i className="esri-icon-cursor-marquee"></i>
          &nbsp; بدء التحديد
        </button>
      </div>

      {/* <label >التحديد من الخريطة</label>
      <button  className="button primaryBtn" onClick={() => activateInteractiveSelection()}>
      <i className="esri-icon-cursor-filled"></i>
      &nbsp;  تفعيل التحديد</button>
    
      <button  className="button primaryBtn" onClick={() => deActivateInteractiveSelection()}>
      <i className="esri-icon-cursor"></i>
      &nbsp;  تعطيل التحديد</button> */}

      <button className="button primaryBtn" onClick={() => stopSelection()}>
        <i className="esri-icon-close"></i>
        &nbsp; الغاء التحديد
      </button>
    </div>
  );
}
