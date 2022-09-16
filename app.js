const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const express = require('express')
const ejs = require('ejs')
const mongoose = require('mongoose')
// models
const db = require('./model/index')

// connecting to mongodb
mongoose.connect('mongodb://127.0.0.1:27017/loctech_attendance_app')
    .then(()=>console.log("connected to db"))
    .catch(err=>console.log('Error: ', err))

// Express app
const app = express()

// Listening to db
const port = 3000
app.listen(port,()=>console.log('App connected and listening to port: ', port))

// set view engine
app.set('view engine', 'ejs')

// middlewares
app.use('/assets', express.static('assets'))
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// handling the get routes
app.get('/', (req, res)=>{
    res.render('index')
})
app.get('/register', (req, res)=>{
    res.render('register')
})
app.get('/login', (req, res)=>{
    res.render('login')
})
app.get('/homepage', protectRoute, async(req, res)=>{
    // Email from payload of JWT
    const InstructorEmailFromPayLoadOfJWT = req.user.instructor.email
    console.log(InstructorEmailFromPayLoadOfJWT)
                // Read operations
    // QUERIES I DO NOT NEED FOR NOW!!!
    // const getStudents = await getInstructor(InstructorEmailFromPayLoadOfJWT, 'students')
    // const getAttendance = await getInstructor(InstructorEmailFromPayLoadOfJWT, 'attendances')
    const getClassrooms = await getInstructor(InstructorEmailFromPayLoadOfJWT, 'classrooms')
    // Accessing data from database
    const instructorName = getClassrooms.instructorName
    const className = getClassrooms.classrooms
    console.log("className: "+className)
    
    res.render('homepage', { className,instructorName })
})

app.get('/dashboard/:className', protectRoute, async (req, res)=>{
    const className = req.params.className
    console.log(className, 'kkkkkkkkk')
    // Email from payload of JWT
    const InstructorEmailFromPayLoadOfJWT = req.user.instructor.email
    console.log(InstructorEmailFromPayLoadOfJWT)
                    // Read operations
    const getClassrooms = await getInstructor(InstructorEmailFromPayLoadOfJWT, 'classrooms')
    // Accessing Weeks from classroom collection by read and populate
    const weeksDoc = await getClassroom(className, 'weeks')
    const w = weeksDoc.weeks
    // Accessing instructorName from classroom collection
    const instructorName = getClassrooms.instructorName
    const classrooms = getClassrooms.classrooms
    const largestWeek = 2
    console.log(largestWeek,'gggggggg')
    // Looping throught the classroom collection
    const classNames = classrooms.map(e=>e.className)
    const classroom = classrooms.filter(e=>{
        if(e.className === className){
            return e
        }
    })
    const numberOfWeeksFromDB = classroom.map(e=>e.numberOfWeeks)
    const numberOfWeeks = parseInt(numberOfWeeksFromDB.join())
    const classDaysFromDB = classroom.map(e=>e.classDays)
    const cD = classDaysFromDB.join()

    const classDays = cD.split(',')
    
    console.log(classDays, 'ddsddddddddddddd')
    // Looping throught the weeks collection
    const dayOfModule = w.map(e=> e.dayOfModule)
    const titleOfModule = w.map(e=> e.titleOfModule)
    const weekNo = w.map(e=> e.weekNo)
    console.log("weekNo: "+ weekNo)
    console.log("titleOfModule: "+ titleOfModule)

    res.render('dashboard', {instructorName,className,classDays,numberOfWeeks,dayOfModule,titleOfModule,weekNo})
})
// Forbidden route
// app.get('/dashboard', protectRoute, async(req, res)=>{})
app.get('/createNewClassroom', (req, res)=>{
    res.render('createNewClassroom')
})
app.get('/logout', (req, res)=>{
    res.clearCookie('token')
    res.redirect('/')
})

// handling the post routes
app.post('/register', async (req, res)=>{
    const instructorNameFromUI = req.body.instructorName
    const instructorEmailFromUI = req.body.instructorEmail
    const instructorPasswordFromUI = req.body.instructorPassword
    // Salting the password
    const saltNo = 10
    const genSalt = await bcrypt.genSalt(saltNo)
    const hashedPassword = await bcrypt.hash(instructorPasswordFromUI, genSalt)
    // Persisting to db
    saveToInstructor(instructorNameFromUI,instructorEmailFromUI,hashedPassword)

   res.render('login')
})
app.post('/login', (req, res)=>{
    const instructorEmailFromUI = req.body.instructorEmail
    const instructorPasswordFromUI = req.body.instructorPassword
    console.log(instructorEmailFromUI,instructorPasswordFromUI)
    // retrieving password from db
    db.Instructors.findOne({ instructorEmail: instructorEmailFromUI })
        .then((instructor)=>{
            const InstructorEmailFromDB = instructor.instructorEmail
            console.log("Instructor from db in login: ", instructor)
            // comparing password from frontend with backend
            bcrypt.compare(instructorPasswordFromUI, instructor.instructorPassword, async (err, data)=>{
                if(err){
                    console.log(err)
                }
                if(data){
                    console.log("Login Details are: ", data)
                    const token = await makeToken(InstructorEmailFromDB)
                    console.log(token)
                    // make httpOnly:true later
                    res.cookie('token', token, {httpOnly: false})
                                    // Read operations
                    const getClassrooms = await getInstructor(InstructorEmailFromDB, 'classrooms')
                    // Accessing data from database
                    const instructorName = getClassrooms.instructorName
                    const className = getClassrooms.classrooms
                    console.log(`instructorName:  ${instructorName}  className: ${className}`)
                    // make httpOnly:true later
                    // res.cookie('instructorName', instructorName, {httpOnly: false})
                    
                    res.render('homepage', { className,instructorName })
                }
                else{
                    res.redirect('/register')
                    console.log('Wrong Password')
                }
            })
        })
        .catch((err)=>{
            console.log(err)
        })
})
app.post('/createNewClassroom', protectRoute, async (req, res)=>{
    const classNameFromUI = req.body.className
    const classDaysFromUI = req.body.classDays
    const numberOfWeeksFromUI = req.body.numberOfWeeks
    // Email from payload of JWT
    const InstructorEmailFromPayLoadOfJWT = req.user.instructor.email
    // Persisting to db
    const SavedClassroom = await saveToClassroom(classNameFromUI,classDaysFromUI,numberOfWeeksFromUI)
    const classroomId = SavedClassroom._id
    option = {classrooms: classroomId}
    // Updating to Instructor collection
    findInstructorAndUpdate(InstructorEmailFromPayLoadOfJWT, option)
    // ***Not updating classrooms in attenndance collection***//
    // Updating to Attendance collection
    findAttendanceAndUpdate(classNameFromUI, option)

    // to be more efficient use res.render with cookies to the pass the className
    res.redirect('homepage')
})
app.post('/insertModule', protectRoute, async (req, res)=>{
    const weekNoFromUI = req.body.weekNo
    const dayOfModuleFromUI = req.body.dayOfModule
    const titleOfModuleFromUI = req.body.titleOfModule
    const classNameFromUI = req.body.className
    // Persisting to db
    const SavedWeek = await saveToWeek(weekNoFromUI,dayOfModuleFromUI,titleOfModuleFromUI,classNameFromUI)
    // getting Weeks id
    const weekId = SavedWeek._id
    option = {weeks: weekId}
    // Updating to Classroom collection
    findClassroomAndUpdate(classNameFromUI,option)
    // className
    const className = classNameFromUI
    res.render('dashboard', {className})
})
app.post('/markAttendance', protectRoute, async (req, res)=>{
    const checkedNameFromUI = req.body.checkedName
    const statusFromUI = req.body.status
    const dayOfAttendanceFromUI = req.body.dayOfAttendance
    const classNameFromUI = req.body.className
    // Email from payload of JWT
    const InstructorEmailFromPayLoadOfJWT = req.user.instructor.email
    // Persisting to db
    const SavedAttendance = await saveToAttendance(checkedNameFromUI,statusFromUI,dayOfAttendanceFromUI,classNameFromUI)
    const attendanceId = SavedAttendance._id
    option = {attendances: attendanceId}
    // Updating to Instructor collection
    findInstructorAndUpdate(InstructorEmailFromPayLoadOfJWT, option)
    // Updating to Student collection
    findStudentAndUpdate(classNameFromUI, option)
    // className
    const className = classNameFromUI
    res.render('dashboard', {className})
})
app.post('/insertNewStudent', protectRoute, async (req, res)=>{
    const studentNameFromUI = req.body.studentName
    const studentEmailFromUI = req.body.studentEmail
    const parentEmailFromUI = req.body.parentEmail
    const parentPhoneNoFromUI = req.body.parentPhoneNo
    const studentPhoneNoFromUI = req.body.studentPhoneNo
    const genderFromUI = req.body.gender
    const dobFromUI = req.body.dob
    const classNameFromUI = req.body.className
    // Email from payload of JWT
    const InstructorEmailFromPayLoadOfJWT = req.user.instructor.email
    // Persisting to db
    const SavedStudent = await saveToStudent(studentNameFromUI,studentEmailFromUI,parentEmailFromUI,parentPhoneNoFromUI,studentPhoneNoFromUI,genderFromUI,dobFromUI,classNameFromUI)
    const studentId = SavedStudent._id
    option = {students: studentId}
    // Updating to Instructor collection
    findInstructorAndUpdate(InstructorEmailFromPayLoadOfJWT, option)
    // Updating to Classroom collection
    findClassroomAndUpdate(classNameFromUI,option)
    // className
    const className = classNameFromUI
    res.render('dashboard', {className})
})

// jwt
const secretKey = 'Thisisatest'
async function makeToken(emailFromUI){
    const secretKey = 'Thisisatest'
    const payload = {
        instructor: {
            email: emailFromUI
        }
    }
    const token = await jwt.sign(payload,secretKey,{expiresIn: '3600s'})
    return token
}

// protecting routes
function protectRoute(req, res, next){
    const token = req.cookies.token
    // console.log(`Token: ${req.cookies.token}`)
    try{
        req.user = jwt.verify(token,secretKey)
        // const instructorEmail =  req.user.instructor.email
        // console.log(instructorEmail)
        next()
    }
    catch(err){
        res.clearCookie('token')
        return res.redirect('/')
        console.log('Error: ', err)
    }
}

// Create operation
const createInstructor = function(instructor){
    return db.Instructors.create(instructor)
        .then(docInstructors=>{
            console.log("\n>>Created Instructor: \n", docInstructors)
            return docInstructors
        })
}
const createClassroom = function(classroom){
    return db.Classroom.create(classroom)
        .then(docClassroom=>docClassroom)
}
const createWeek = function(week){
    return db.Weeks.create(week)
        .then(docWeek=> docWeek)
}
const createAttendance = function(attendance){
    return db.Attendance.create(attendance)
        .then(docAttendance=>docAttendance)
}
const createStudent = function(student){
    return db.Students.create(student)
        .then(docStudent=>docStudent)
}

// Create operation- Schema Construct
const saveToInstructor = async function(instructorName,instructorEmail,instructorPassword){
    const Instructor = await createInstructor({
        instructorName,
        instructorEmail,
        instructorPassword,
        classroom: [],
        students: [],
        attendance: []
    })
    console.log("\n>>Created Instructor:\n", Instructor)
}
const saveToClassroom = async function(className,classDays,numberOfWeeks){
    var Classroom = await createClassroom({
        className,
        classDays,
        numberOfWeeks,
        weeks: [],
        students: []
    })
    console.log("\n>>saved to Classroom:\n", Classroom)
    return Classroom
}
const saveToWeek = async function(weekNo,dayOfModule,titleOfModule,className){
    var Week = await createWeek({
        weekNo,
        dayOfModule,
        titleOfModule,
        className
    })
    console.log("\n>>Created Week:\n", Week)
    return Week
}
const saveToAttendance = async function(checkedName,status,dayOfAttendance,className){
    var Attendance = await createAttendance({
        checkedName,
        status,
        dayOfAttendance,
        className
    })
    console.log("\n>>Created Attendance:\n", Attendance)
    return Attendance
}
const saveToStudent = async function(studentName,studentEmail,parentEmail,parentPhoneNo,studentPhoneNo,gender,dob,className){
    var Student = await createStudent({
        studentName,
        studentEmail,
        parentEmail,
        parentPhoneNo,
        studentPhoneNo,
        gender,
        dob,
        className
    })
    console.log("\n>>Created Student:\n", Student)
    return Student
}

// Read only operation
function getOnlyInstructors(instructorEmail){
    return db.Instructors.findOne({instructorEmail})
    .then((instructor)=>{
        // console.log("result: "+instructor)
        return instructor
    }).catch((err)=>{
        console.log("err: "+err)
    })
}

// Read and Update Operation
function findInstructorAndUpdate(email, object){
    // console.log(`Email from app.post: ${email}, Classroom from app.post: ${object.classroom}. Outside app.post`)
    db.Instructors.findOne({instructorEmail: email})
    .then((docInstructor)=>{
        const InstructorId = docInstructor._id
        db.Instructors.findByIdAndUpdate(
            InstructorId,
            { $push: object},
            { new: true, useFindAndModify: false },
            function(err){
                if(err){
                    console.log("Instructor Update Error: "+ err)
                }
                else{
                    console.log("Instructor Update success")
                }
            }
        )
    })
}
function findClassroomAndUpdate(className,object){
    // console.log( `ClassName from app.post: ${className}, Weeks from app.post: ${object.weeks}. Outside app.post`)
    db.Classroom.findOne({className})
    .then((docClassroom)=>{
        const ClassroomId = docClassroom._id
        db.Classroom.findByIdAndUpdate(
            ClassroomId,
            { $push: object},
            { new: true, useFindAndModify: false },
            function(err){
                if(err){
                console.log("Classroom Update Error: " + err)
                }
                else{
                    console.log("Classroom Update success")
                }
            }
        )
    })
}
function findStudentAndUpdate(className,object){
    // console.log( `className from app.post: ${className}, attendance from app.post: ${object.attendances}. Outside app.post`)
    db.Students.findOne({className})
    .then((docStudent)=>{
        console.log(docStudent)
        const StudentId = docStudent._id
        db.Students.findByIdAndUpdate(
            StudentId,
            { $push: object},
            { new: true, useFindAndModify: false },
            function(err){
                if(err){
                console.log("Student Update Error: " + err)
                }
                else{
                    console.log("Student Update success")
                }
            }
        )
    })
}
// Not working!
function findAttendanceAndUpdate(className,object){
    console.log( `className from app.post: ${className}, classrooms from app.post: ${object.classrooms}. Outside app.post`)
    db.Attendance.findOne({className})
    .then((docAttendance)=>{
        console.log("docAttendance: " + docAttendance)
        const AttendanceId = docAttendance._id
        db.Attendance.findByIdAndUpdate(
            AttendanceId,
            { $push: object},
            { new: true, useFindAndModify: false },
            function(err){
                if(err){
                console.log("Attendance Update Error: " + err)
                }
                else{
                    console.log("Attendance Update success")
                }
            }
        )
    })
}

// Read and populate operations
function getInstructor(instructorEmail, collectionName){
    return db.Instructors.findOne({instructorEmail})
    .populate(collectionName, "-_id -__v")
    .then((instructor)=>{
        // console.log("result: "+instructor)
        return instructor
    }).catch((err)=>{
        console.log("err: "+err)
    })
}
function getClassroom(className, collectionName){
    return db.Classroom.findOne({className})
    .populate(collectionName, "-_id -__v")
    .then((classroom)=>{
        // console.log("result: "+instructor)
        return classroom
    }).catch((err)=>{
        console.log("err: "+err)
    })
}
function getStudent(className, collectionName){
    return db.Students.findOne({className})
    .populate(collectionName, "-_id -__v")
    .then((student)=>{
        // console.log("result: "+instructor)
        return student
    }).catch((err)=>{
        console.log("err: "+err)
    })
}