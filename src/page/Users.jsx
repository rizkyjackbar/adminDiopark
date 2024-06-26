import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import RenderLineChart from "../components/LineChart";
import RenderBarChart from "../components/BarChart";
import TimeRangeFilter from "../components/TimeRangeFilter";
import FilterBox from "../components/FilterBox";
import RenderReport from "../components/TransactionsReport";

const HOST_DEV = "http://localhost:3000";
const HOST_PROD = "https://dioparkapp-production.up.railway.app";
const HOST = process.env.NODE_ENV === "production" ? HOST_PROD : HOST_DEV;


const processData = (dataStream, timeRange, startTime = null, endTime = null) => {
  const currentDate = new Date();
  let filteredData = dataStream;

  if (timeRange === '7days') {
    const sevenDaysAgo = new Date(currentDate);
    sevenDaysAgo.setDate(currentDate.getDate() - 7);
    filteredData = dataStream.filter(entry => new Date(entry.waktu_parkir) >= sevenDaysAgo);
  } else if (timeRange === '1month') {
    const thirtyDaysAgo = new Date(currentDate);
    thirtyDaysAgo.setDate(currentDate.getDate() - 30);
    filteredData = dataStream.filter(entry => new Date(entry.waktu_parkir) >= thirtyDaysAgo);
  } else if (timeRange === '1year') {
    const oneYearAgo = new Date(currentDate);
    oneYearAgo.setFullYear(currentDate.getFullYear() - 1);
    filteredData = dataStream.filter(entry => new Date(entry.waktu_parkir) >= oneYearAgo);
  } else if (timeRange === 'today') {
    const todayDate = currentDate.toISOString().split('T')[0];
    filteredData = dataStream.filter(entry => entry.waktu_parkir.split('T')[0] === todayDate);
  }

  return filteredData;
};


function Users() {
  const [statsData, setStatsData] = useState([]);
  const [totalTransaksi, setTotalTransaksi] = useState([]);
  const [timeRange, setTimeRange] = useState("today");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("11:59");

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
  };

  const fetchStatsData = async () => {
    try {
      const token = getCookie("token");
      if (!token) throw new Error("Token not found in cookies");

      const statsResponse = await fetch(`${HOST}/api/statistic/transaksi`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (statsResponse.ok) {
        const newStatsData = await statsResponse.json();
        console.log(newStatsData);
        setStatsData(newStatsData.transaksi);
        setTotalTransaksi(newStatsData.totalTransaksi);
      } 

    } catch (error) {
      console.error("Error fetching stats data:", error);
    }
  };

  useEffect(() => {
    fetchStatsData();
  }, []);

  const filteredData = processData(statsData, timeRange, startTime, endTime);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6 bg-blue-100">
        < RenderReport totalTrans={totalTransaksi} allTrans={statsData}/>
        <div className="grid grid-cols-2 gap-12 mb-4 ml-5">
          <div>
            <TimeRangeFilter onChange={setTimeRange} />
          </div>
          <div>
            {timeRange === "today" && (
              <FilterBox
                startTime={startTime}
                endTime={endTime}
                onStartTimeChange={setStartTime}
                onEndTimeChange={setEndTime}
              />
            )}
          </div>
        </div>
        <div className="grid grid-cols-2">
          <div>
            <RenderLineChart
              dataStream={filteredData}
              timeRange={timeRange}
              startTime={startTime}
              endTime={endTime}
            />
          </div>
          <div>
            <RenderBarChart vehicleData={filteredData} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default Users;
