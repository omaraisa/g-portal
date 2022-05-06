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
    EditorWidget =new Editor()
    EditorWidget.view = view;
    EditorWidget.container = editorRef.current;
    EditorWidget.render()
    sendBackWidget({editor:EditorWidget})
  },[]);

  return (
    <div style={styles.container} ref={editorRef}></div>
  );
}

/*
import { useState, useRef, useEffect,useContext } from "react";
import Editor from '@arcgis/core/widgets/Editor'
import { AppContext } from "../../pages";

let EditorWidget;
export default function EditorComponent({view,sendBackWidget}) {
  const editorRef = useRef()
  const [layers] = useContext(AppContext)
  const localLayers=[]
  localLayers.concat(layers)
  const [state, setState] = useState({editingAllowd:false})
  const styles = {
    container: {
      height: "100%"
    },
  };
  
  useEffect(()=> {
    EditorWidget =new Editor()
    EditorWidget.view = view;
    EditorWidget.container = editorRef.current;
    EditorWidget.render()
    sendBackWidget({editor:EditorWidget})
  },[]);
  
  // useEffect(()=> {
  //   console.log("fired",state.editingAllowd)
  //   if(layers)
  //   {
  //     const editingAllowd = layers.some(layer => layer.type === "feature")
  //     console.log("editingAllowd",state.editingAllowd)
  //     console.log(layers)

  //   }
  // },[view]);

  return (
    <div className="flex-column-container">
      {localLayers.some(layer => layer.type === "feature")? <span>there are layers</span> : <span>there are no layers</span>}
      <div style={styles.container} ref={editorRef}></div>
    </div>
  );
}
*/