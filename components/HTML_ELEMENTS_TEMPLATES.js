export default function HTML_ELEMENTS_TEMPLATES(props) {
  const styles = {
    container: {
      display: "flex",
      flexGrow: 1,
      flexFlow: "column nowrap",
      gap: "1rem",
      width: "100%",
      paddingBottom: "1rem",
    },
  };
  return (
    <div style={styles.container}>
      <h5>HTML_ELEMENTS_TEMPLATES</h5>

      <button className="button primaryBtn">primaryBtn</button>
      <button
        className="button secondaryBtn"
        onClick={() => props.addWidget("legend")}
      >
        secondaryBtn
      </button>
      <button
        className="button dangerBtn"
        onClick={() => props.addWidget("scalebar")}
      >
        dangerBtn
      </button>
      <button className="button warningBtn">warningBtn</button>
      <button className="button successBtn">successBtn</button>
      <button className="button grayBtn">grayBtn</button>
      <button className="button darkBtn">darkBtn</button>
      <button className="button roundBtn">roundBtn</button>

      <select className="select" required>
        <option value="" hidden>اختر</option>
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
        <option value="3">Option 3</option>
        <option value="4">Option 4</option>
        <option value="5">Option 5</option>
      </select>

      
      <input type="checkbox" id="switch" className="switch-input" />
      <label htmlFor="switch" className="switch-lable">
        Toggle
      </label>

      <input type="number" className="input-number" id="id" min="10" max="100"></input>


      <input type="checkbox" className="checkbox" id="_checkbox"></input>
      <label className="tick-label" htmlFor="_checkbox">
        <div id="tick_mark"></div>
      </label>

      <input type="color"></input>

      <input
        type="file"
        name="file-1[]"
        id="file-1"
        className="inputfile inputfile-1"
        data-multiple-caption="{count} files selected"
        multiple
      />
      <label htmlFor="file-1">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="17"
          viewBox="0 0 20 17"
        >
          <path d="M10 0l-5.2 4.9h3.3v5.1h3.8v-5.1h3.3l-5.2-4.9zm9.3 11.5l-3.2-2.1h-2l3.4 2.6h-3.5c-.1 0-.2.1-.2.1l-.8 2.3h-6l-.8-2.2c-.1-.1-.1-.2-.2-.2h-3.6l3.4-2.6h-2l-3.2 2.1c-.4.3-.7 1-.6 1.5l.6 3.1c.1.5.7.9 1.2.9h16.3c.6 0 1.1-.4 1.3-.9l.6-3.1c.1-.5-.2-1.2-.7-1.5z" />
        </svg>{" "}
        <span> اختر ملف&hellip;</span>
      </label>

      <button id="btnId" className="button downloadBtn">
        <label htmlFor="btnId">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
            width="20"
            height="17"
          >
            <path d="M480 352h-133.5l-45.25 45.25C289.2 409.3 273.1 416 256 416s-33.16-6.656-45.25-18.75L165.5 352H32c-17.67 0-32 14.33-32 32v96c0 17.67 14.33 32 32 32h448c17.67 0 32-14.33 32-32v-96C512 366.3 497.7 352 480 352zM432 456c-13.2 0-24-10.8-24-24c0-13.2 10.8-24 24-24s24 10.8 24 24C456 445.2 445.2 456 432 456zM233.4 374.6C239.6 380.9 247.8 384 256 384s16.38-3.125 22.62-9.375l128-128c12.49-12.5 12.49-32.75 0-45.25c-12.5-12.5-32.76-12.5-45.25 0L288 274.8V32c0-17.67-14.33-32-32-32C238.3 0 224 14.33 224 32v242.8L150.6 201.4c-12.49-12.5-32.75-12.5-45.25 0c-12.49 12.5-12.49 32.75 0 45.25L233.4 374.6z" />
          </svg>{" "}
          <span> تحميل</span>
        </label>
      </button>

      <label htmlFor="textInput" className="textInput">
        <input
          type="text"
          className="input-text"
          id="textInput"
          placeholder="&nbsp;"
        ></input>
        <span className="label">الاسم</span>
        <span className="focus-bg"></span>
      </label>

      <textarea name="" id="" cols="30" rows="3"></textarea>
    </div>
  );
}
