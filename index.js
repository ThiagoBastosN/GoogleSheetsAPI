const credentials = {
    /* Here it goes your Google Sheets credetials, the ones that
    come in the JSON file that you download from http://console.developers.google.com/ */
}

const { GoogleSpreadsheet } = require('google-spreadsheet');

const docId = 'Here is the sheet ID that is located at the URL'

const createStudentObject = (registration, name, absences, p1, p2, p3, situation, neededScore) =>
{
    if(typeof registration == 'undefined') return null;

    const student = {
        registration,
        name,
        absences,
        p1,
        p2,
        p3,
        situation,
        neededScore
    }
    return student;
}

const connectAndRetrieveSpreadSheetData = async () =>
{
    const doc = new GoogleSpreadsheet(docId);
    await doc.useServiceAccountAuth(credentials);
    await doc.loadInfo();

    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();

    return rows;
}

const populateStudentsArray = async () =>
{
    const rows = await connectAndRetrieveSpreadSheetData();
    const students = [];
    rows.forEach(row =>{
        if(typeof row.Aluno !== 'undefined')
        {
            //For each row that is an Aluno, create a student object.
            const student = createStudentObject(
                row.Matricula, 
                row.Aluno, 
                row.Faltas, 
                row.P1, 
                row.P2, 
                row.P3,
                row['Situação'],
                row['Nota para Aprovação Final']
            );
    
            students.push(student);
        }
    });
    return students;
}
const calculateStudentGrade = async () =>
{
    const students = await populateStudentsArray();
    students.forEach(student =>{
        const { p1, p2, p3 } = student;
        //Parse the values that come from the sheet into numbers.
        const average = (parseInt(p1) + parseInt(p2) + parseInt(p3))/3;
        student.grade = Math.ceil(average);
    });
    return students;
}

const checkStudentApproved = async () => {
    const students = await calculateStudentGrade();

    students.forEach(student =>{
        if(parseInt(student.absences) >(60 * 0.25))
        {
            student.situation = "Reprovado por Falta";
            student.neededScore = -1
            return;
        }
        
        if(student.grade >= 70)
        {
            student.situation = "Aprovado";
            student.neededScore = 0;
        }else if(student.grade >= 50 && student.grade < 70)
        {
            student.situation = "Exame Final";
            student.neededScore = 100 - student.grade;
        }else
        {
            student.situation = "Reprovado por Nota";
            student.neededScore = -1;
        }
    })
    return students;
}

const writeToTheSheet = async () => 
{
    const students = await checkStudentApproved();
    console.log(students);
    const rows = await connectAndRetrieveSpreadSheetData();

    students.forEach((student, index) =>{
        //Pushes the data into the sheet.
        rows[index]['Situação'] = student.situation;
        rows[index]['Nota para Aprovação Final'] = student.neededScore;
        rows[index].save();
    })

}

writeToTheSheet();
