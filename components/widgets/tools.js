import { useState, useRef, useContext, useEffect } from "react";
import { AppContext } from "../../pages";
import styles from "./tools.module.css";

export default function Tools() {
  const { layout, goToSubMenu } = useContext(AppContext);
  const [state, setState] = useState({
    activeTool: null,
  });
  const toolSet = [
    {
      name: "محول الاحداثيات",
      class: "esri-icon-blank-map-pin",
      id: "CoordinateConversion",
    },
    {
      name: "قياس المسافة",
      class: "esri-icon-measure",
      id: "MeasureDistance",
    },
    {
      name: "قياس المساحة",
      class: "esri-icon-measure-area",
      id: "MeasureArea",
    },
    {
      name: "تحرير البيانات",
      class: "esri-icon-edit",
      id: "Editor",
    },
    {
      name: "النوافذ المنبثقة",
      class: "esri-icon-configure-popup",
      id: "PopupManager",
    },
    {
      name: "خرائط الأساس",
      class: "esri-icon-basemap",
      id: "Basemap",
    },
    {
      name: "مدير النصوص",
      class: "esri-icon-labels",
      id: "LabelManager",
    },
    {
      name: "مدير التمثيل",
      class: "esri-icon-maps",
      id: "SymbologyManager",
    },
  ];
  function toggleTool(id, state) {
    goToSubMenu(id)
    setState({ ...state, activeTool:id});
  }
  useEffect(() => {
   const thereIsActiveTool =  toolSet.some(tool =>layout.subMenuCurrentComponent === tool.id)
   thereIsActiveTool
   ? setState({ ...state, activeTool:layout.subMenuCurrentComponent})
   : setState({ ...state, activeTool:null})
  },[layout])

  return (
    <div className={`flex-row-container`} style={{ flexWrap: "wrap" }}>
      {toolSet.map((tool) => {
        return (
          <div
            key={tool.id}
            className={
              state.activeTool === tool.id
                ? `${styles.toolsContainer} ${styles.activeTool} `
                : `${styles.toolsContainer} `
            }
            onClick={() => toggleTool(tool.id, state)}
          >
            <i className={`${tool.class} ${styles.toolIcon}`}></i>
            {tool.name}
          </div>
        );
      })}
    </div>
  );
}
