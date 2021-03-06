import { useRef, useEffect, useContext } from "react";
import LayerList from "@arcgis/core/widgets/LayerList";
import { AppContext } from "../../pages";
import * as GIS from "../../modules/gis-module";

let LayerListWidget, layerIndex;
const featureOptions = [
  {
    //title: "Go to full extent",
    title: "عرض كامل البيانات",
    className: "esri-icon-zoom-out-fixed",
    id: "fullExtent",
  },
  {
    //title: "Attribute Table",
    title: "البيانات الوصفية",
    className: "esri-icon-table",
    id: "attributeTable",
  },
  {
    //title: "labeling",
    title: "النصوص",
    className: "esri-icon-labels",
    id: "labeling",
  },
  {
    //title: "Popup Window",
    title: "النافذة المنبثقة",
    className: "esri-icon-configure-popup",
    id: "popup",
  },
    {
      //title: "Symbology",
      title: "التمثيل",
      className: "esri-icon-maps",
      id: "symbology",
    },
    {
      //title: "Export",
      title: "تصدير البيانات",
      className: "esri-icon-download",
      id: "exportData",
    },
]
const rasterOptions = []

export default function LayerListComponent({ sendBackWidget }) {
  const { map, view, updateTargetLayers, goToSubMenu, goToBottomPane } =
    useContext(AppContext);
  const LayerListRef = useRef();
  const styles = {
    container: {
      height: "100%",
    },
  };

  useEffect(() => {
    if (view) {
      LayerListWidget = new LayerList({
        view: view,
        container: LayerListRef.current,
        selectionEnabled: true,
        multipleSelectionEnabled: true,
        listItemCreatedFunction: function (event) {
          const item = event.item;

          item.panel = {
            content: "legend",
            open: false,
            visible: true,
          };
            item.actionsSections = [
              GIS.supportedLayerTypes.includes(event.item.layer.type) && featureOptions,
              [
                {
                  //title: "Move Up",
                  title: "التحريك لأعلى",
                  className: "esri-icon-up-arrow",
                  id: "moveUp",
                },
                {
                  //title: "Move Down",
                  title: "التحريك لأسفل",
                  className: "esri-icon-down-arrow",
                  id: "moveDown",
                },
              ],
              [
                {
                  //title: "Delete Layer",
                  title: "حذف الطبقة",
                  className: "esri-icon-close",
                  id: "deleteLayer",
                },
              ],
            ];
        },
      });

      LayerListWidget.on("trigger-action", function (event) {
        const id = event.action.id;
        const selectedLayer = event.item.layer;
        const actionTrigger = {
          fullExtent: () => fullExtent(),
          symbology: () => symbology(),
          labeling: () => labeling(),
          attributeTable: () => attributeTable(),
          exportData: () => exportData(),
          popup: () => popup(),
          moveUp: () => moveUp(),
          moveDown: () => moveDown(),
          deleteLayer: () => deleteLayer(),
        };
        actionTrigger[id]();

        function fullExtent() {
          view.goTo(selectedLayer.fullExtent);
        }
        function information() {
          window.open(selectedLayer.url);
        }
        function labeling() {
            updateTargetLayers({ labelingTargetLayer: selectedLayer });
            goToSubMenu("LabelManager");
        }
        function symbology() {
            updateTargetLayers({ symbologyTargetLayer: selectedLayer });
            goToSubMenu("SymbologyManager");
        }
        function attributeTable() {
            updateTargetLayers({ FeatureTableLayer: selectedLayer });
            goToBottomPane("FeatureTable");
        }
        function exportData() {
          updateTargetLayers({ exportingTargetLayer: selectedLayer });
          goToSubMenu("ExportManager");
        }
        function popup() {
          updateTargetLayers({ popupTargetLayer: selectedLayer });
          goToSubMenu("PopupManager");
        }
        function moveUp() {
          getLayerIndex(selectedLayer.id);
          moveLayerUp(selectedLayer);
        }
        function moveDown() {
          getLayerIndex(selectedLayer.id);
          moveLayerDown(selectedLayer);
        }
        function deleteLayer() {
          map.remove(selectedLayer);
        }
      });

      function getLayerIndex(id) {
        const layers = map.layers.items;
        layers.forEach(matchID);

        function matchID(layer, index) {
          if (id === layer.id) {
            layerIndex = index;
          }
        }
      }

      function moveLayerUp(layer) {
        const maxIndex = map.layers.length;
        if (layerIndex < maxIndex) {
          map.reorder(layer, layerIndex + 1);
        }
      }

      function moveLayerDown(layer) {
        if (layerIndex > 0) {
          map.reorder(layer, layerIndex - 1);
        }
      }

      LayerListWidget.render();
      sendBackWidget({ layerlist: LayerListWidget });
    }
  }, [view]);

  return <div style={styles.container} ref={LayerListRef}></div>;
}
