import "./App.css";
import Website from "./components/Website";
import plus from "./assets/gray plus.svg";
function App() {
  const bg_dark = "#202020";
  return (
    <>
      <div className={`h-[500px] w-[300px] border bg-[${bg_dark}]`}>
        <div className="h-1/12 flex justify-center items-center">
          <h1 className="text-3xl ">friction</h1>
        </div>
        <div className="h-11/12 ">
          <h2 className="text-2xl h-[50] flex justify-center bg-gray-600">
            websites
          </h2>
          <Website bg={"#707070"} gradient={"#999999"} src={plus} />
        </div>
      </div>
    </>
  );
}

export default App;
