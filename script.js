
const $ = id => document.getElementById(id);

function loadData(key, fallback) {
    try {
        const saved = localStorage.getItem(key);
        return saved === null ? fallback : JSON.parse(saved);
    } catch {
        return fallback;
    }
}

let students = loadData("attendanceStudents", [
    { id: "101", name: "Amina", department: "BSc CS" },
    { id: "102", name: "Ananya", department: "BSc CS" },
    { id: "103", name: "Arjun", department: "BSc CS" },
    { id: "104", name: "Ayesha", department: "BSc CS" },
    { id: "105", name: "Divya", department: "BSc CS" },
    { id: "106", name: "Fatima", department: "BSc CS" },
    { id: "107", name: "Karthik", department: "BSc CS" },
    { id: "108", name: "Mohammed", department: "BSc CS" },
    { id: "109", name: "Nisha", department: "BSc CS" },
    { id: "110", name: "Priya", department: "BSc CS" },
    { id: "111", name: "Rahul", department: "BSc CS" },
    { id: "112", name: "Rohan", department: "BSc CS" },
    { id: "113", name: "Sana", department: "BSc CS" },
    { id: "114", name: "Sneha", department: "BSc CS" },
    { id: "115", name: "Zoya", department: "BSc CS" }
]);

let attendance = loadData("attendanceRecords", []);
let editingId = null;

function todayString() {
    const now = new Date();
    return new Date(now.getTime() -
        now.getTimezoneOffset() * 60000)
        .toISOString().slice(0, 10);
}

$("attendanceDate").value = todayString();

function saveData() {
    localStorage.setItem("attendanceStudents",
        JSON.stringify(students));
    localStorage.setItem("attendanceRecords",
        JSON.stringify(attendance));
}

function getRecord(id, date) {
    return attendance.find(r =>
        r.studentId === id && r.date === date);
}

function getStatus(id) {
    const record = getRecord(id, $("attendanceDate").value);
    return record ? record.status : "Not Marked";
}

function studentPercentage(id) {
    const records = attendance.filter(r =>
        r.studentId === id &&
        ["Present", "Absent", "Late"].includes(r.status));

    if (!records.length) return null;

    const present = records.filter(r =>
        r.status === "Present").length;

    return present / records.length * 100;
}

// Add or edit student details
$("studentForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const id = $("studentId").value.trim();
    const name = $("studentName").value.trim();
    const department = $("department").value.trim();

    const duplicate = students.some(s =>
        s.id.toLowerCase() === id.toLowerCase() &&
        s.id !== editingId);

    if (duplicate) {
        alert("Student ID already exists!");
        return;
    }

    if (editingId !== null) {
        const student = students.find(s => s.id === editingId);
        const oldId = student.id;

        student.id = id;
        student.name = name;
        student.department = department;

        attendance.forEach(r => {
            if (r.studentId === oldId) r.studentId = id;
        });

        editingId = null;
    } else {
        students.push({ id, name, department });
    }

    students.sort((a, b) => a.name.localeCompare(b.name));

    saveData();
    this.reset();
    $("formTitle").textContent = "Add Student";
    $("saveBtn").textContent = "Add Student";
    $("cancelEdit").hidden = true;
    renderAll();
});

function editStudent(id) {
    const s = students.find(s => s.id === id);
    if (!s) return;

    editingId = id;
    $("studentId").value = s.id;
    $("studentName").value = s.name;
    $("department").value = s.department;
    $("formTitle").textContent = "Edit Student";
    $("saveBtn").textContent = "Save Changes";
    $("cancelEdit").hidden = false;
}

function cancelEditing() {
    editingId = null;
    $("studentForm").reset();
    $("formTitle").textContent = "Add Student";
    $("saveBtn").textContent = "Add Student";
    $("cancelEdit").hidden = true;
}

$("cancelEdit").addEventListener("click", cancelEditing);

// Delete student and their attendance history
function deleteStudent(id) {
    const s = students.find(s => s.id === id);
    if (!s || !confirm("Delete " + s.name +
        " and their attendance history?")) return;

    students = students.filter(s => s.id !== id);
    attendance = attendance.filter(r => r.studentId !== id);

    if (editingId === id) cancelEditing();

    saveData();
    renderAll();
}

// Mark attendance without creating duplicate date entries
function markAttendance(id, status) {
    const date = $("attendanceDate").value;
    if (!date) {
        alert("Select a date first.");
        return;
    }

    let record = getRecord(id, date);

    if (record) {
        record.status = status;
    } else {
        attendance.push({
            studentId: id,
            date: date,
            status: status
        });
    }

    saveData();
    renderAll();
}

function cell(text) {
    const td = document.createElement("td");
    td.textContent = text;
    return td;
}

function button(text, style, action) {
    const b = document.createElement("button");
    b.textContent = text;
    b.className = style;
    b.type = "button";
    b.addEventListener("click", action);
    return b;
}

// Display and filter students
function renderStudents() {
    const body = $("studentList");
    body.innerHTML = "";

    const query = $("search").value.toLowerCase().trim();
    const dept = $("departmentFilter").value;
    const filterStatus = $("statusFilter").value;

    const filtered = students.filter(s =>
        (s.name.toLowerCase().includes(query) ||
         s.id.toLowerCase().includes(query) ||
         s.department.toLowerCase().includes(query)) &&
        (!dept || s.department === dept) &&
        (!filterStatus || getStatus(s.id) === filterStatus)
    );

    filtered.forEach(s => {
        const row = document.createElement("tr");
        const percent = studentPercentage(s.id);

        row.appendChild(cell(s.id));
        row.appendChild(cell(s.name));
        row.appendChild(cell(s.department));

        const p = cell(percent === null
            ? "No records" : percent.toFixed(1) + "%");

        p.className = percent !== null &&
            percent < Number($("threshold").value)
            ? "low" : "good";

        row.appendChild(p);
        row.appendChild(cell(getStatus(s.id)));

        const mark = document.createElement("td");

        [
            ["Present", "present"],
            ["Absent", "absent"],
            ["Leave", "leave"],
            ["Late", "late"]
        ].forEach(([status, style]) => {
            mark.appendChild(button(status, style,
                () => markAttendance(s.id, status)));
        });

        row.appendChild(mark);

        const actions = document.createElement("td");
        actions.appendChild(button("Edit", "", () =>
            editStudent(s.id)));
        actions.appendChild(button("Delete", "delete", () =>
            deleteStudent(s.id)));

        row.appendChild(actions);
        body.appendChild(row);
    });

    $("recordCount").textContent =
        "Showing " + filtered.length + " of " +
        students.length + " students.";
}

// Dashboard summary
function renderSummary() {
    const date = $("attendanceDate").value;
    const todays = attendance.filter(r => r.date === date);

    $("totalStudents").textContent = students.length;
    $("presentToday").textContent =
        todays.filter(r => r.status === "Present").length;
    $("absentToday").textContent =
        todays.filter(r => r.status === "Absent").length;

    const counted = attendance.filter(r =>
        ["Present", "Absent", "Late"].includes(r.status));

    const present = counted.filter(r =>
        r.status === "Present").length;

    const percent = counted.length
        ? (present / counted.length * 100).toFixed(1)
        : "0.0";

    $("overallPercent").textContent = percent + "%";
}

// Low attendance warnings
function renderLowAttendance() {
    const threshold = Number($("threshold").value);
    const area = $("lowAttendance");
    area.innerHTML = "";

    const low = students.filter(s => {
        const p = studentPercentage(s.id);
        return p !== null && p < threshold;
    });

    if (!low.length) {
        area.textContent = "No low attendance alerts.";
        return;
    }

    low.forEach(s => {
        const p = studentPercentage(s.id);
        const line = document.createElement("p");
        line.className = "low";
        line.textContent = s.name + " (" + s.id + "): " +
            p.toFixed(1) + "% attendance";
        area.appendChild(line);
    });
}

// Department and student dropdowns
function renderDropdowns() {
    const deptSelect = $("departmentFilter");
    const oldDept = deptSelect.value;

    deptSelect.innerHTML =
        '<option value="">All Departments</option>';

    [...new Set(students.map(s => s.department))]
        .sort().forEach(dept => {
            const option = document.createElement("option");
            option.value = dept;
            option.textContent = dept;
            deptSelect.appendChild(option);
        });

    deptSelect.value = oldDept;

    const history = $("historyStudent");
    const oldStudent = history.value;

    history.innerHTML =
        '<option value="">Select a student</option>';

    students.forEach(s => {
        const option = document.createElement("option");
        option.value = s.id;
        option.textContent = s.name + " (" + s.id + ")";
        history.appendChild(option);
    });

    history.value = oldStudent;
}

// Student-wise attendance history
function renderHistory() {
    const id = $("historyStudent").value;
    const body = $("historyList");
    body.innerHTML = "";

    if (!id) return;

    const s = students.find(s => s.id === id);
    if (!s) return;

    const records = attendance
        .filter(r => r.studentId === id)
        .sort((a, b) => b.date.localeCompare(a.date));

    if (!records.length) {
        body.appendChild(cell("No attendance history yet."));
        return;
    }

    records.forEach(r => {
        const row = document.createElement("tr");
        row.appendChild(cell(r.date));
        row.appendChild(cell(s.id));
        row.appendChild(cell(s.name));
        row.appendChild(cell(r.status));
        body.appendChild(row);
    });
}

function renderAll() {
    renderDropdowns();
    renderStudents();
    renderSummary();
    renderLowAttendance();
    renderHistory();
}

$("search").addEventListener("input", renderStudents);
$("departmentFilter").addEventListener("change", renderStudents);
$("statusFilter").addEventListener("change", renderStudents);
$("attendanceDate").addEventListener("change", renderAll);

$("threshold").addEventListener("input", () => {
    renderStudents();
    renderLowAttendance();
});

$("historyStudent").addEventListener("change", renderHistory);

// Initial setup
students.sort((a, b) => a.name.localeCompare(b.name));
saveData();
renderAll();
