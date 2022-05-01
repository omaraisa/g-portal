// import styles from './bookmark.module.css'
import React, { useState, useRef } from "react";

export default function ScratchLayerField({
  id,
  updateFieldInfo,
  deleteField,
}) {
  const styles = {
    container: {
      display: "flex",
      flexFlow: "row nowrap",
      alignItems: "center",
      widght: "100%",
      gap: ".5rem"
    },
    deleteBtn: {
      fontSize: "2rem",
      flex: 0.1,
      cursor:"pointer"
    },
    fieldName: {
      flex: 0.6,
    },
    fieldType: {
      flex: 0.3,
    },
  };
  const fieldName = useRef();
  const fieldType = useRef();
  const [state, setState] = useState({ id, fieldName: "", fieldType: "" });
  const sendFieldInfo = () => {
    const newState = {
      ...state,
      fieldName: fieldName.current.value,
      fieldType: fieldType.current.value,
    };
    setState(newState);
    updateFieldInfo(newState);
  };
  return (
    <div style={styles.container}>
      <label
        htmlFor="scratchLayerFieldName"
        className="textInput"
        style={styles.fieldName}
      >
        <input
          type="text"
          className="input-text"
          style={styles.fieldName}
          id="scratchLayerFieldName"
          placeholder="&nbsp;"
          ref={fieldName}
          onChange={() => sendFieldInfo()}
        ></input>
        <span className="label">اسم الحقل</span>
        <span className="focus-bg"></span>
      </label>

      <select
        id="scratchLayerType"
        className="select"
        required
        ref={fieldType}
        style={styles.fieldType}
        onChange={() => sendFieldInfo()}
      >
        <option value="" hidden>
          اختر
        </option>
        <option value="string">نصي</option>
        <option value="double">عددي</option>
      </select>

      <i
        className={`esri-icon-close-circled`}
        style={styles.deleteBtn}
        onClick={() => deleteField(id)}
      ></i>
    </div>
  );
}
