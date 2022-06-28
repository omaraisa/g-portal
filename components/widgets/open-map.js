import { useState, useRef, useContext, useEffect } from "react";
import { AppContext } from "../../pages";
import Basemap from "@arcgis/core/Basemap";
import Extent from "@arcgis/core/geometry/Extent";
import CSVLayer from "@arcgis/core/layers/CSVLayer";
import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer";
import KMLLayer from "@arcgis/core/layers/KMLLayer";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import MapImageLayer from "@arcgis/core/layers/MapImageLayer";
import Graphic from "@arcgis/core/Graphic";
import * as rendererJsonUtils from "@arcgis/core/renderers/support/jsonUtils";
import Field from "@arcgis/core/layers/support/Field";
import LabelClass from "@arcgis/core/layers/support/LabelClass";
import PopupTemplate from "@arcgis/core/PopupTemplate";
import { FileUploader } from "react-drag-drop-files";

const layerGenerator = [
  {
    type: "csv",
    layer: CSVLayer,
  },
  {
    type: "geojson",
    layer: GeoJSONLayer,
  },
  {
    type: "kml",
    layer: KMLLayer,
  },
  {
    type: "feature",
    layer: FeatureLayer,
  },
  {
    type: "map-image",
    layer: MapImageLayer,
  },
];

export default function OpenMap() {
  const [state, setState] = useState({
    fileName: null,
    extension: null,
  });
  const { map, view, widgets, sendMessage } =
    useContext(AppContext);

  function openMap({ basemap, extent, layerSources }) {
    map.removeAll();
    view.graphics.removeAll();
    map.basemap = Basemap.fromJSON(basemap);
    view.goTo(Extent.fromJSON(extent));
    layerSources.forEach((layerSource) => {
      layerSource.sourceIncluded ? addLayerFromSource() : addLayerFromURL()
      
      function addLayerFromSource() {
        const source = layerSource.layerFeatures.map(graphicJSON => Graphic.fromJSON(graphicJSON))
        const newLayer = new FeatureLayer({
          title: layerSource.title,
          renderer: rendererJsonUtils.fromJSON(layerSource.renderer),
          opacity: layerSource.opacity,
          visible: layerSource.visible,
          geometryType: layerSource.geometryType,
          legendEnabled: layerSource.legendEnabled,
          source: source,
        });
        handleFields(newLayer, layerSource);
        handlePopupTemplates(newLayer, layerSource)
        handleLabelingInfo(newLayer, layerSource);
        map.add(newLayer,layerSource.index);
      }

      function addLayerFromURL() {
        const constructor = layerGenerator.find(
          (constructor) => constructor.type === layerSource.type
        );
        if (constructor) {
          const newLayer = new constructor.layer({
            url: layerSource.url,
            opacity: layerSource.opacity,
            visible: layerSource.visible,
            legendEnabled: layerSource.legendEnabled,
          });
          map.add(newLayer);
          newLayer.when(() => {
            if (layerSource.renderer) {
              newLayer.renderer = rendererJsonUtils.fromJSON(
                layerSource.renderer
              );
            }
            handleLabelingInfo(newLayer, layerSource);
            handlePopupTemplates(newLayer, layerSource);
            widgets["legend"].layerInfos.push({
              layer: newLayer,
            });
          });
        }
      }

    });
    setState({fileName:null,extension:null });
  }
  

  function handleFields(newLayer, layerSource) {
  try {
    if (layerSource.fields) {
      newLayer.fields = layerSource.fields.map((field) => Field.fromJSON(field));
    }
  } catch (error) {
    console.log(error)
  }
  }

  function handlePopupTemplates(newLayer, layerSource) {
    try {
      if (layerSource.popupTemplate) {
        newLayer.popupTemplate = PopupTemplate.fromJSON(layerSource.popupTemplate)
        newLayer.popupEnabled = layerSource.popupEnabled;
      }
    } catch (error) {
      console.log(error)
    }
  }

  function handleLabelingInfo(newLayer, layerSource) {
    try {
      if (layerSource.labelingInfo) {
        newLayer.labelingInfo = layerSource.labelingInfo.map((labelClass) =>LabelClass.fromJSON(labelClass));
        newLayer.labelsVisible = layerSource.labelsVisible;
      }
    } catch (error) {
      console.log(error)
    }
  }

  function fileIsValid(file, extension) {
    const requirements = [
      {
        condition: extension === "gpmap",
        errorMessage: "عفواً، ملف الخريطة هو ملف ينتهي بالصيغة .gpmap",
      },
      {
        condition: file.layerSources && file.extent && file.basemap,
        errorMessage: "عفواً ملف الخريطة غير مكتمل",
      },
    ];

    const error = requirements.find((requirement) => !requirement.condition);
    return error ? error : { condition: true };
  }

  function prepareFile(file,fileName,extension) {
    setState({ ...state,fileName,extension, ...file });
  }

  function fileChecker(file) {
    if (file) {
      const fileName = file.name.replace(/\..+$/, "");
      const extension = file.name.split(".").pop();
      var reader = new FileReader();
      reader.readAsText(file);
      reader.onload = function (event) {
        try {
          var parsedFile = JSON.parse(event.target.result);
          const validationResponse = fileIsValid(parsedFile, extension);
          validationResponse.condition
            ? prepareFile(parsedFile,fileName,extension)
            : sendErrorMessage(validationResponse.errorMessage);
        } catch (error) {
          console.log(error);
          sendErrorMessage("عفواً ملف الخريطة غير صالح");
        }
      };
    }
  }

  function sendErrorMessage(errorMessage) {
    sendMessage({
      type: "error",
      title: "فتح خريطة",
      body: errorMessage,
    });
  }

  // useEffect(() => console.log(state), [state]);

  return (
    <div className="flex-column-container">
      <h3>رفع ملف الخريطة</h3>

      {state.fileName && (
          <span>
            <b>{`${state.fileName}.${state.extension}`}</b>
          </span>
        )}


      <FileUploader
          handleChange={fileChecker}
          name="file"
          types={["gpmap"]}
          multiple={false}
          label="اضغط أو ألقي الملف"
          // eslint-disable-next-line react/no-children-prop
          children={
            <div className="drag-drop-zone">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="33"
            viewBox="0 0 20 17"
          >
            <path fill="#2f80ed" d="M10 0l-5.2 4.9h3.3v5.1h3.8v-5.1h3.3l-5.2-4.9zm9.3 11.5l-3.2-2.1h-2l3.4 2.6h-3.5c-.1 0-.2.1-.2.1l-.8 2.3h-6l-.8-2.2c-.1-.1-.1-.2-.2-.2h-3.6l3.4-2.6h-2l-3.2 2.1c-.4.3-.7 1-.6 1.5l.6 3.1c.1.5.7.9 1.2.9h16.3c.6 0 1.1-.4 1.3-.9l.6-3.1c.1-.5-.2-1.2-.7-1.5z" />
          </svg>
          <span> اضغط أو ألقي الملف&hellip;</span>
        </div>
          }
        />   
      <button
        className="button successBtn"
        disabled={!state.extent}
        onClick={() => openMap(state)}
      >
        فتح الخريطة
      </button>
    </div>
  );
}
