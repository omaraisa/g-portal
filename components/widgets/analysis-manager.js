import { useState, useRef, useContext } from "react";
import { AppContext } from "../../pages";
import styles from "./analysis-manager.module.css";

export default function AnalysisManager() {
  const { sendMessage, goToSubMenu } = useContext(AppContext);
  const [state, setState] = useState({
    overlay: true,
    proximity: true,
    extract: true,
  });

  return (
    <div className="flex-column-container" >
     <span className="info-text">يمكنك تحديد جزء من البيانات للتحليل</span> 
      <button
        className="button secondaryBtn rightBtn"
        onClick={() => goToSubMenu("SelectFeatures")}
      >
        <i className="esri-icon-cursor-marquee"></i>
        تحديد المعالم
      </button>
      <div className={styles.toolsDiv} style={{ direction: "ltr" }}>
      <b
        onClick={() => setState({ ...state, overlay: !state.overlay })}
        
      >
        {state.overlay ? "+" : "-"} Overlay
      </b>
      <ul hidden={state.overlay}>
        <li onClick={() => goToSubMenu("IntersectionAnalysis")}>Intersect</li>
        <li onClick={() => goToSubMenu("SelectFeatures")}>Union</li>
      </ul>

      <b
        onClick={() => setState({ ...state, proximity: !state.proximity })}
        
      >
        {state.proximity ? "+" : "-"} Proximity
      </b>
      <ul hidden={state.proximity}>
        <li onClick={() => goToSubMenu("SelectFeatures")}>Buffer</li>
        <li onClick={() => goToSubMenu("SelectFeatures")}>Near</li>
      </ul>

      <b
        onClick={() => setState({ ...state, extract: !state.extract })}
        
      >
        {state.extract ? "+" : "-"} Extract
      </b>
      <ul hidden={state.extract}>
        <li onClick={() => goToSubMenu("Query")}>Select</li>
        <li onClick={() => goToSubMenu("SelectFeatures")}>Clip</li>
      </ul>



    </div>
    </div>
  );
}
