import NavButton from "./sub_components/nav-button";
import styles from "./header.module.css";
import Image from "next/image";

export default function Header(props) {
  return (
    <div className={styles.header}>
      <Image src="/images/logo.png" alt="me" width="40" height="40" />
      <h1 className={styles.title}>جي بورتال</h1>
      <NavButton
        toolTip="تحديد المعالم"
        iconClass="esri-icon-cursor-marquee"
        activeNav={props.activeSubMenu === "SelectFeatures" ? true : false}
        goTo={() => props.goTo(props.activeSubMenu === "SelectFeatures" ? "DefaultPane" :"SelectFeatures")}
      />
        <NavButton
          toolTip="خرائط الأساس"
          iconClass="esri-icon-basemap"
          activeNav={props.activeSubMenu === "Basemap" ? true : false}
          goTo={() => props.goTo(props.activeSubMenu === "Basemap" ? "DefaultPane" :"Basemap")}
        />
      <NavButton
        toolTip="الرسم والتحرير"
        iconClass="esri-icon-edit"
        activeNav={props.activeSubMenu === "Editor" ? true : false}
        goTo={() => props.goTo(props.activeSubMenu === "Editor" ? "DefaultPane" :"Editor")}
      />
      <NavButton
        toolTip="العلامات المرجعية"
        iconClass="esri-icon-bookmark"
        activeNav={props.activeSubMenu === "Bookmarks" ? true : false}
        goTo={() => props.goTo(props.activeSubMenu === "Bookmarks" ? "DefaultPane" :"Bookmarks")}
      />
      <NavButton
        toolTip="طباعة الخريطة"
        iconClass="esri-icon-printer"
        activeNav={props.activeSubMenu === "Print" ? true : false}
        goTo={() => props.goTo(props.activeSubMenu === "Print" ? "DefaultPane" :"Print")}
      />
      <NavButton
        toolTip="حفظ الخريطة"
        iconClass="esri-icon-save"
        activeNav={props.activeSubMenu === "SaveMap" ? true : false}
        goTo={() => props.goTo(props.activeSubMenu === "SaveMap" ? "DefaultPane" :"SaveMap")}
      />
      <NavButton
        toolTip="فتح الخريطة"
        iconClass="far fa-folder-open"
        activeNav={props.activeSubMenu === "OpenMap" ? true : false}
        goTo={() => props.goTo(props.activeSubMenu === "OpenMap" ? "DefaultPane" :"OpenMap")}
      />
      <NavButton
        toolTip="عن المنصة"
        iconClass="esri-icon-description"
        activeNav={props.activeSubMenu === "GPortalInfo" ? true : false}
        goTo={() => props.goTo(props.activeSubMenu === "GPortalInfo" ? "DefaultPane" :"GPortalInfo")}
      />
    </div>
  );
}