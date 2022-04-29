import { useState, useRef, useContext } from "react";
import { AppContext } from "../../pages"


export default function AnalysisManager() {
  const { sendMessage, goToSubMenu } = useContext(AppContext);



  return (
    <div className="flex-column-container">
      <button
        className="button secondaryBtn rightBtn"
        onClick={()=>goToSubMenu("SelectFeatures")}
      >
        <i className="esri-icon-cursor-marquee"></i>
        تحديد المعالم
      </button>  
     </div>
  )
}
