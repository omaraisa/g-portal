import React, { useState, useRef, useEffect } from "react";
import Bookmark from "../sub_components/bookmark";

export default function Bookmarks({view}) {
  const bookmarkName = useRef();
  const [state, setState] = useState([]);
  const [formVisible, setFormVisibility] = useState(false);
  useEffect(() => {
    if (localStorage.getItem("localBookmarks") !== null) {
      setState(JSON.parse(localStorage.getItem("localBookmarks")));
    }
  }, []);

  
  const addBookmark = () => {
    const id = Math.floor(new Date().getTime())+Math.floor(Math.random() * 999);
    const newBookmark = {
      id: id,
      name: bookmarkName.current.value,
      extent: view.extent,
    };
    const newBookmarksDB = [...state, newBookmark];
    localStorage.setItem("localBookmarks", JSON.stringify(newBookmarksDB));
    setState([...newBookmarksDB]);
    setFormVisibility(false);
  };

  const deleteBookmark = (targetId) => {
    const newBookmarksDB = state.filter((bookmark) => bookmark.id !== targetId);
    localStorage.setItem("localBookmarks", JSON.stringify(newBookmarksDB));
    setState([...newBookmarksDB]);
  };

  const initAddBookmarkForm = () => {
    setFormVisibility(true);
  };

  
  /*********************************************/
  useEffect(() => console.log(state),[state])
  return (
    <div className="flex-column-container" >
      <h1>العلامات المرجعية المرجعية</h1>
      {formVisible || (
        <div className="bookmarks flex-column-container" >
          <button
            className="button primaryBtn"
            onClick={() => initAddBookmarkForm()}
          >
            <i className="esri-icon-plus-circled"></i> إضافة علامة مرجعية
          </button>

          {state.length ? (
            state.map((bookmark) => (
              <Bookmark
                key={bookmark.id}
                {...bookmark}
                view = {view}
                deleteBookmark={(id) => deleteBookmark(id)}
              />
            ))
          ) : (
            <span>لا توجد علامات مرجعية</span>
          )}
        </div>
      )}
      {formVisible && (
        <div className="add-bookmark">
          <label htmlFor="textInput" className="textInput">
            <input
              type="text"
              className="input-text"
              id="textInput"
              ref={bookmarkName}
              placeholder="&nbsp;"
            ></input>
            <span className="label">اسم العلامة المرجعية</span>
            <span className="focus-bg"></span>
          </label>
          <button className="button successBtn" onClick={() => addBookmark()}>
            <i className="esri-icon-save"></i> حفظ العلامة مرجعية
          </button>
        </div>
      )}
    </div>
  );
}
