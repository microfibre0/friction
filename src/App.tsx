import "./App.css";
import Website from "./components/Website";
import Add from "./components/Add";
import { useState, useRef } from "react";
function App() {
  interface model {
    [key: string]: unknown;
  }

  const bg_dark = "#202020";
  const [websites, setWebsites] = useState<model>({});
  const updated = useRef(false);

  const getSites = async () => {
    // retrieve site options from chrome storage
    if (!updated.current) {
      const storage = await chrome.storage.sync.get();
      setWebsites(storage);
      updated.current = true;
    }
  };

  getSites();

  return (
    <>
      <div className={`h-[500px] w-[300px] border bg-[${bg_dark}]`}>
        <div className="h-1/12 flex justify-center items-center">
          <h1 className="text-3xl ">friction</h1>
          <Add />
        </div>
        <div className="h-11/12 ">
          <h2 className="text-2xl h-[50] flex justify-center bg-gray-600">
            websites
          </h2>
          {Object.keys(websites).map((website) => (
            <Website
              title={website}
              btn_tmr={
                updated.current
                  ? (websites as { [name: string]: { btn_tmr: boolean } })[
                      website
                    ].btn_tmr
                  : false
              }
              hide_img={
                updated.current
                  ? (websites as { [name: string]: { hide_img: boolean } })[
                      website
                    ].hide_img
                  : false
              }
              url={
                updated.current
                  ? (websites as { [name: string]: { url: string } })[website]
                      .url
                  : ""
              }
              bg={"#3b3b3b"}
              gradient={"#737373"}
            />
          ))}
        </div>
      </div>
    </>
  );
}

export default App;
