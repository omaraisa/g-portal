import { useState, useRef, useEffect,useContext } from "react";
import Editor from '@arcgis/core/widgets/Editor'
import { AppContext } from "../../pages";

let EditorWidget;
export default function EditorComponent({view,sendBackWidget}) {
  const editorRef = useRef()
  const styles = {
    container: {
      height: "100%"
    },
  };
  
  useEffect(()=> {
    EditorWidget = new Editor({
      container: editorRef.current,
      view,
    })
    EditorWidget.render()
    sendBackWidget({editor:EditorWidget})
  },[]);

  function stopEditing() {
    if(EditorWidget)
      EditorWidget.activeWorkflow && EditorWidget.cancelWorkflow() 
  }

  return (
    <div className="flex-column-container">
    <div className="flex-column-container">
      <button
        className="button dangerBtn"
        onClick={() => stopEditing()}
      >
        ايقاف التحرير
      </button>
    </div>
      <div style={styles.container} ref={editorRef}></div>
    </div>
  );
}
