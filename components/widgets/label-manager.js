import { useState, useRef, useEffect, useContext } from "react";
import { AppContext } from "../../pages";
import Slider from "@arcgis/core/widgets/Slider";
import * as GIS from "../../modules/gis-module";

const defaultLabelProps = {
  visible: false,
  labelField: "",
  color: "#000000",
  haloColor: "#ffffff",
  fontSize: 10,
  haloSize: 1,
  suffix: "",
  prefix: "",
};

export default function LabelManager() {
  const { map, layers, targetLayers, updateTargetLayers, sendMessage } =
    useContext(AppContext);
  const [
    labelSwitchRef,
    layerSelectorRef,
    fieldSelectorRef,
    fontSizeSliderDiv,
    haloSizeSliderDiv,
    colorRef,
    haloColorRef,
    prefixRef,
    suffixRef,
  ] = [
    useRef(),
    useRef(),
    useRef(),
    useRef(),
    useRef(),
    useRef(),
    useRef(),
    useRef(),
    useRef(),
  ];
  const [state, setState] = useState({
    targetLayer: {},
    currentLabelProps: {},
    fieldsNames: [],
    layersLabel: [],
  });
  const stateRef = useRef();
  stateRef.current = state;

  function sendErrorMessage(errorMessage) {
    sendMessage({
      type: "error",
      title: "خطأ في إدارة النصوص",
      body: errorMessage,
    });
  }

  useEffect(() => {
    const fontSizeSlider = new Slider({
      container: fontSizeSliderDiv.current,
      min: 6,
      max: 40,
      values: [10],
      steps: 1,
      snapOnClickEnabled: false,
      visibleElements: {
        labels: true,
        rangeLabels: true,
      },
    });
    fontSizeSlider.render();

    const haloSizeSlider = new Slider({
      container: haloSizeSliderDiv.current,
      min: 0,
      max: 8,
      values: [1],
      steps: 1,
      snapOnClickEnabled: false,
      visibleElements: {
        labels: true,
        rangeLabels: true,
      },
    });
    haloSizeSlider.render();

    fontSizeSlider.on("thumb-drag", function (event) {
      if (stateRef.current.currentLabelProps.fontSize) {
        updateLabelProps("fontSize", event.value, stateRef.current);
        setState({
          ...stateRef.current,
          currentLabelProps: {
            ...stateRef.current.currentLabelProps,
            fontSize: event.value,
          },
        });
      }
    });

    haloSizeSlider.on("thumb-drag", function (event) {
      if (stateRef.current.currentLabelProps.fontSize) {
        updateLabelProps("haloSize", event.value, stateRef.current);
        setState({
          ...stateRef.current,
          currentLabelProps: {
            ...stateRef.current.currentLabelProps,
            haloSize: event.value,
          },
        });
      }
    });
  }, [fontSizeSliderDiv]);

  useEffect(() => {
    const targetLayer = targetLayers.labelingTargetLayer;
    if (targetLayer) {
      try {
        const fieldsNames = targetLayer.fields.map((field) => field.name);
        const previousLabelProps = { ...state.currentLabelProps };
        state.layersLabel.find(
          (labelInfo) => labelInfo.layerID === targetLayer.id
        )
          ? setTargetLayer(targetLayer, fieldsNames, previousLabelProps, state)
          : addNewLabelInfo(
              targetLayer,
              fieldsNames,
              previousLabelProps,
              state
            );
        // clearRemovedLayersLabels(state);
        layerSelectorRef.current.value = targetLayer.id;
      } catch (error) {
        sendErrorMessage(
          "عفواً حدث خطأ أثناء معالجة نصوص الطبقة، الرجاء المحاولة مرة أخرى"
        );
        console.log(error);
      }
    }
  }, [targetLayers.labelingTargetLayer]);

  function getUpdatedLayersLabel(previousLabelProps, state) {
    const currentLayersIDs = layers.map(layer => layer.id)
    const layersLabel =  state.layersLabel.map((labelInfo) => {
      if (labelInfo.layerID === state.targetLayer.id)
      labelInfo.labelProps = { ...previousLabelProps };
      return labelInfo;
    });
    return layersLabel.filter((labelInfo) => currentLayersIDs.includes(labelInfo.layerID));
  }

  function setTargetLayer(targetLayer, fieldsNames, previousLabelProps, state) {
    const layersLabel = getUpdatedLayersLabel(previousLabelProps, state);
    const currentLabelProps = state.layersLabel.find(
      (labelInfo) => labelInfo.layerID === targetLayer.id
    ).labelProps;
    changeInputsValues(currentLabelProps);
    setState({
      ...state,
      fieldsNames,
      layersLabel,
      currentLabelProps,
      targetLayer,
    });
  }

  function addNewLabelInfo(
    targetLayer,
    fieldsNames,
    previousLabelProps,
    state
  ) {
    const labelingInfo = [
      {
        type: "label",
        labelExpression: null,
        labelExpressionInfo: null,
        symbol: {
          type: "text",
          color: "#000000",
          font: {
            size: 10,
          },
        },
        haloColor: "#ffffff",
        haloSize: 2,
      },
    ];

    targetLayer.labelingInfo = [...labelingInfo];
    targetLayer.labelsVisible = false;
    const newLabelInfo = {
      layerID: targetLayer.id,
      labelProps: { ...defaultLabelProps },
    };
    const updatedLayersLabel = getUpdatedLayersLabel(previousLabelProps, state);
    const layersLabel = [...updatedLayersLabel, newLabelInfo];
    const currentLabelProps = { ...defaultLabelProps };
    changeInputsValues(currentLabelProps);
    setState({
      ...state,
      targetLayer,
      fieldsNames,
      layersLabel,
      currentLabelProps,
    });
  }

  function updateLabelProps(property, newValue, state) {
    try {
      const targetLabel = state.currentLabelProps;

    const layerLabelProps = {
      visible: () => updateLayerVisibility(newValue),
      labelField: () => updateLayerLabelFeild(newValue),
      color: () => updateLayerColor(newValue),
      haloColor: () => updateLayerHaloColor(newValue),
      fontSize: () => updateLayerFontSize(newValue),
      haloSize: () => updateLayerHaloSize(newValue),
      suffix: () => updateLayerSuffix(newValue),
      prefix: () => updateLayerPrefix(newValue),
    };

    function updateLayerVisibility(newValue) {
      state.targetLayer.labelsVisible = newValue;
    }
    function updateLayerLabelFeild(newValue) {
      const labelExpressionInfo = {
        expression: `$feature.${newValue}`,
      };
      const expression = `${targetLabel.prefix} [${newValue}] ${targetLabel.suffix}`;
      state.targetLayer.type === "feature"
        ? (state.targetLayer.labelingInfo[0].labelExpression = expression)
        : (state.targetLayer.labelingInfo[0].labelExpressionInfo =
            labelExpressionInfo);
    }
    function updateLayerPrefix(newValue) {
      const expression = `${newValue} [${targetLabel.labelField}] ${targetLabel.suffix}`;

      state.targetLayer.labelingInfo[0].labelExpression = expression;
    }
    function updateLayerSuffix(newValue) {
      const expression = `${targetLabel.prefix} [${targetLabel.labelField}] ${newValue}`;
      state.targetLayer.labelingInfo[0].labelExpression = expression;
    }
    function updateLayerColor(newValue) {
      state.targetLayer.labelingInfo[0].symbol.color = newValue;
    }
    function updateLayerHaloColor(newValue) {
      state.targetLayer.labelingInfo[0].symbol.haloColor = newValue;
    }
    function updateLayerFontSize(newValue) {
      state.targetLayer.labelingInfo[0].symbol.font.size = newValue;
    }
    function updateLayerHaloSize(newValue) {
      state.targetLayer.labelingInfo[0].symbol.haloSize = newValue;
    }

    layerLabelProps[property]();
    const currentLabelProps = { ...state.currentLabelProps };
    currentLabelProps[property] = newValue;
    setState({ ...state, currentLabelProps });
    
    } catch (error) {
      sendErrorMessage("عفواً فشلت عملية تعديل خصائص النصوص، الرجاء المحاولة مرة أخرى")
      console.log(error)
    }
  }

  function changeInputsValues({
    visible = false,
    color = "#000000",
    haloColor = "#ffffff",
    fontSize = 10,
    haloSize = 2,
    prefix = "",
    suffix = "",
  }) {
    labelSwitchRef.current.checked = visible;
    colorRef.current.value = color;
    haloColorRef.current.value = haloColor;
    prefixRef.current.value = prefix;
    suffixRef.current.value = suffix;
  }

  useEffect(() => console.log(state), [state]);

  return (
    <div className="flex-column-container">
      <h3>مدير النصوص Label Manager</h3>

      <div
        className="flex-column-container"
        style={{ border: "solid 1px #e7e7e7", padding: "1rem" }}
      >
        <label htmlFor="targetLayer">اختر الطبقة</label>
        <select
          id="targetLayer"
          className="select"
          ref={layerSelectorRef}
          onChange={(event) =>
            updateTargetLayers({
              labelingTargetLayer: map.findLayerById(event.target.value),
            })
          }
        >
          <option value="" hidden>
            اختر
          </option>
          {layers.map((layer) => {
            if (GIS.supportedLayerTypes.includes(layer.type)) {
              return (
                <option key={layer.id} value={layer.id}>
                  {layer.title}
                </option>
              );
            }
          })}
        </select>

        <label htmlFor="fieldSelectorRef">حدد الحقل</label>
        <select
          ref={fieldSelectorRef}
          id="fieldSelectorRef"
          className="select"
          value={
            state.currentLabelProps.labelField
              ? state.currentLabelProps.labelField
              : ""
          }
          onChange={(event) =>
            updateLabelProps("labelField", event.target.value, state)
          }
        >
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

        <div className="flex-row-container">
          <input
            type="checkbox"
            id="labelSwitch"
            ref={labelSwitchRef}
            defaultChecked={false}
            className="switch-input"
            onChange={(event) =>
              updateLabelProps("visible", event.target.checked, state)
            }
          />
          <label htmlFor="labelSwitch" className="switch-lable"></label>
          <label htmlFor="labelSwitch">إظهار النصوص</label>
        </div>
      </div>

      <div
        className="flex-column-container"
        style={{ border: "solid 1px #e7e7e7", padding: "1rem" }}
      >
        <label htmlFor="fontColor">تغيير لون الخط</label>
        <input
          id="fontColor"
          type="color"
          ref={colorRef}
          onChange={(event) =>
            updateLabelProps("color", event.target.value, state)
          }
        ></input>
        <label htmlFor="haloColor">تغيير لون الاطار</label>
        <input
          id="haloColor"
          type="color"
          ref={haloColorRef}
          onChange={(event) =>
            updateLabelProps("haloColor", event.target.value, state)
          }
        ></input>
        <div
          className="flex-column-container"
          style={{ marginTop: "2rem", gap: "4rem" }}
        >
          <div ref={fontSizeSliderDiv}></div>
          <div ref={haloSizeSliderDiv}></div>
        </div>
        <label htmlFor="prefix">ما قبل النص</label>
        <input
          className="inputText"
          type="text"
          id="prefix"
          ref={prefixRef}
          disabled={state.targetLayer.type !== "feature"}
          onChange={(event) =>
            updateLabelProps("prefix", event.target.value, state)
          }
        ></input>
        <label htmlFor="fontColor">ما بعد النص</label>
        <input
          className="inputText"
          type="text"
          id="suffix"
          ref={suffixRef}
          disabled={state.targetLayer.type !== "feature"}
          onChange={(event) =>
            updateLabelProps("suffix", event.target.value, state)
          }
        ></input>
      </div>
    </div>
  );
}
