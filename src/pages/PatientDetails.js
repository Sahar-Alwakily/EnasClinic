/* ----------- PATIENT DETAILS MODERN UI -------------- */

import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ref, onValue } from "firebase/database";
import { db } from "../firebaseConfig";

export default function PatientDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { patientId } = location.state || {};

  const [patient, setPatient] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activeSection, setActiveSection] = useState("info");

  useEffect(() => {
    if (!patientId) {
      navigate("/customers");
      return;
    }

    const patientRef = ref(db, `patients/${patientId}`);
    const unsubscribePatient = onValue(patientRef, (snapshot) => {
      setPatient(snapshot.val());
    });

    const sessionsRef = ref(db, `sessions/${patientId}`);
    const unsubscribeSessions = onValue(sessionsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const sessionsArray = Object.entries(data).map(([id, session]) => ({
        id,
        ...session,
      }));

      const groupedSessions = groupSessionsByDate(sessionsArray);
      setSessions(groupedSessions);
    });

    return () => {
      unsubscribePatient();
      unsubscribeSessions();
    };
  }, [patientId, navigate]);

  const groupSessionsByDate = (sessionsArray) => {
    const grouped = {};

    sessionsArray.forEach((session) => {
      const sessionDate =
        session.date ||
        new Date(session.timestamp).toLocaleDateString("ar-SA");

      if (!grouped[sessionDate]) {
        grouped[sessionDate] = {
          date: sessionDate,
          areas: [],
          therapist: session.therapist,
          amount: session.amount,
          paymentType: session.paymentType,
          notes: session.notes,
          sessions: [],
        };
      }

      const areas = getSessionAreas(session);
      grouped[sessionDate].areas = [
        ...new Set([...grouped[sessionDate].areas, ...areas]),
      ];
      grouped[sessionDate].sessions.push(session);
    });

    return Object.values(grouped).sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
  };

  const renderYesNo = (value) => (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
        value
          ? "bg-green-100 text-green-700 border border-green-300"
          : "bg-gray-200 text-gray-600 border border-gray-300"
      }`}
    >
      {value ? "نعم" : "لا"}
    </span>
  );

  const getAreaNameInArabic = (area) => {
    const areaNames = {
      face: "الوجه",
      neck: "الرقبة",
      arm: "الذراع",
      hand: "اليد",
      elbow: "الكوع",
      armpit: "الإبط",
      abdomen: "البطن",
      back: "الظهر",
      thighs: "الفخذين",
      shin: "الساق",
      feet: "القدمين",
      bikiniArea: "البكيني",
      fullbody: "كامل الجسم",
    };
    return areaNames[area] || area;
  };

  const getSessionAreas = (session) => {
    if (session.partName) {
      return [session.partName];
    }

    const areaKeys = Object.keys(session).filter(
      (key) =>
        ![
          "id",
          "clientId",
          "clientName",
          "date",
          "timestamp",
          "amount",
          "notes",
          "paymentType",
          "therapist",
          "partName",
        ].includes(key)
    );

    if (areaKeys.length > 0) {
      const areaString = areaKeys.map((key) => session[key]).join("");
      return [areaString];
    }

    return ["غير محدد"];
  };

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-500">
        <div className="text-white text-center">
          <div className="animate-spin h-10 w-10 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>جارٍ تحميل البيانات.!!!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {/* HEADER */}
      <div className="bg-white shadow-md rounded-b-3xl pb-6">
        <div className="p-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-900 text-2xl"
          >
            ←
          </button>


        </div>

        {/* Patient Card */}
        <div className="px-4 mt-3">
          <div className="flex items-center gap-4 bg-gradient-to-r from-purple-600/90 to-blue-600/90 p-4 rounded-2xl shadow-xl text-white">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center font-bold text-xl">
              {patient.fullName?.slice(0, 2) || "??"}
            </div>
            <div>
              <h1 className="font-bold text-xl">{patient.fullName}</h1>
              <p className="text-sm opacity-80">
                الهوية: {patient.idNumber} • الهاتف: {patient.phone}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 px-4">
          <div className="flex gap-2 overflow-x-auto">
            {[
              { id: "info", label: "البيانات" },
              { id: "health", label: "الصحة" },
              { id: "sessions", label: "الجلسات" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`px-4 py-2 rounded-xl font-medium text-sm transition ${
                  activeSection === tab.id
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-4">
        {/* INFO */}
        {activeSection === "info" && (
          <div className="space-y-4">
            <GlassCard title="المعلومات الشخصية">
              <Info label="الاسم الكامل" value={patient.fullName} />
              <Info label="رقم الهوية" value={patient.idNumber} />
              <Info label="رقم الهاتف" value={patient.phone} />
              <Info label="تاريخ الميلاد" value={patient.birthDate} />
            </GlassCard>

            <GlassCard title="الحساسية">
              <Info label="حساسية الخبز" value={renderYesNo(patient.allergyBread)} />
              <Info label="حساسية الحليب" value={renderYesNo(patient.allergyMilk)} />
            </GlassCard>
          </div>
        )}

        {/* HEALTH */}
        {activeSection === "health" && (
          <div className="space-y-4">
            <GlassCard title="الصحة العامة">
              <Info label="الحالة الصحية" value={patient.healthStatus} />
              <Info label="ممارسة الرياضة" value={renderYesNo(patient.exercise)} />
              <Info label="الحمل" value={renderYesNo(patient.pregnancy)} />
            </GlassCard>

            <GlassCard title="الأمراض الجلدية">
              <Info label="أمراض جلدية" value={renderYesNo(patient.skinDiseases)} />
            </GlassCard>
          </div>
        )}

        {/* SESSIONS */}
        {activeSection === "sessions" && (
          <div className="space-y-4">
            {sessions.map((group, idx) => (
              <div
                key={idx}
                className="bg-white p-4 rounded-2xl shadow-md border border-purple-100"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-purple-700 font-bold">{group.date}</span>
                  <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs">
                    {group.areas.length} منطقة
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {group.areas.map((a, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs"
                    >
                      {getAreaNameInArabic(a)}
                    </span>
                  ))}
                </div>

                {group.notes && (
                  <p className="text-gray-600 text-sm bg-gray-50 p-2 rounded-lg">
                    {group.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- COMPONENTS ----------- */

function GlassCard({ title, children }) {
  return (
    <div className="bg-white/70 backdrop-blur-lg shadow-lg rounded-2xl border border-white/40 p-4">
      <h3 className="text-purple-700 font-bold mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="flex justify-between bg-gray-50 rounded-lg p-2">
      <span className="text-gray-500 text-sm">{label}</span>
      <span className="font-medium text-gray-800 text-sm">{value}</span>
    </div>
  );
}
