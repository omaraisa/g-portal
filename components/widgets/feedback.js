import Image from "next/image";

export default function Feedback() {
  const style = {
    display: "flex",
    flexFlow: "column wrap",
    textAlign: "justify",
    textJustify: "inter-word",
  };
  return (
    <div style={style}>
      <h3> الملاحظات والمقترحات </h3>
      اذا كانت لديك أي مقترحات أو ملاحظات على هذه النسخة التجريبية فيرجى ارسالها مع الصور التوضيحية على البريد الالكتروني:
      <p><a href="mailto:info@gis-gate.com">info@gis-gate.com</a></p>
   </div>
  );
}
