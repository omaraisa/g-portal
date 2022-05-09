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
      name: "خرائط الأساس",
      class: "esri-icon-basemap",
      id: "Basemap",
    },
    {
      name: "مدير النصوص",
      class: "esri-icon-labels",
      id: "LabelManager",
    },
  ];
  function toggleTool(id, state) {
    goToSubMenu(id)
    setState({ ...state, activeTool:id});
  }
  useEffect(() => {
    toolSet.forEach(tool =>{
      if(layout.subMenuCurrentComponent === tool.id)
      setState({ ...state, activeTool:tool.id});
    })
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
