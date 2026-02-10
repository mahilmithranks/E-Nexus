import dotenv from 'dotenv';
import connectDB from './config/db.js';
import User from './models/User.js';
import Day from './models/Day.js';
import Session from './models/Session.js';
import Attendance from './models/Attendance.js';
import AssignmentSubmission from './models/AssignmentSubmission.js';

dotenv.config();

const studentsData = [
    {
        "name": "Dasaraiahgari Bhavya",
        "registerNumber": "9823005001",
        "email": "9823005001@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Kovvur Priyanka",
        "registerNumber": "9823005005",
        "email": "9823005005@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "M. Surya Teja",
        "registerNumber": "9921005093",
        "email": "9921005093@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Gavini Ramakrishna",
        "registerNumber": "99220040057",
        "email": "99220040057@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Gopal Kumar",
        "registerNumber": "99220040063",
        "email": "99220040063@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Gudapati Charan Saikumar",
        "registerNumber": "99220040066",
        "email": "99220040066@gmail.com",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Narupalli Harinath Reddy",
        "registerNumber": "99220040145",
        "email": "99220040145@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Shaik Saleem",
        "registerNumber": "99220040198",
        "email": "99220040198@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Udayaprakash B",
        "registerNumber": "99220040215",
        "email": "99220040215@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Vijayaragavan",
        "registerNumber": "99220040229",
        "email": "99220040229@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Lakshin Prabhu S",
        "registerNumber": "99220040296",
        "email": "99220040296@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Madasu Jyothi Sri Venkata Siva Charan",
        "registerNumber": "99220040299",
        "email": "99220040299@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Monfort Joel J",
        "registerNumber": "99220040308",
        "email": "99220040308@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Namburi Ajay",
        "registerNumber": "99220040315",
        "email": "99220040315@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Nandigam Soundarya",
        "registerNumber": "99220040316",
        "email": "99220040316@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Pandi Veer Viswa",
        "registerNumber": "99220040342",
        "email": "99220040342@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Seelam Harshitha",
        "registerNumber": "99220040350",
        "email": "99220040350@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Sumanth Reddy Yadapalli",
        "registerNumber": "99220040377",
        "email": "99220040377@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Devarla Sai Snathosh",
        "registerNumber": "99220040389",
        "email": "99220040389@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Kondraju Maneesh",
        "registerNumber": "99220040400",
        "email": "99220040400@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Mohamed Musthafa S",
        "registerNumber": "99220040402",
        "email": "99220040402@klu.ac.in",
        "department": "CSE(AIML)",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Badhri Meghana",
        "registerNumber": "99220040444",
        "email": "99220040444@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Beenapati Madhusudhan Reddy",
        "registerNumber": "99220040452",
        "email": "99220040452@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Chebolu Ganesh Pavan Sai",
        "registerNumber": "99220040469",
        "email": "99220040469@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Devireddy Jithendra Reddy",
        "registerNumber": "99220040489",
        "email": "99220040489@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "D L Durga Prasad",
        "registerNumber": "99220040495",
        "email": "99220040495@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Meghana Jayaram",
        "registerNumber": "99220040549",
        "email": "99220040549@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Koka Kowshik",
        "registerNumber": "99220040576",
        "email": "99220040576@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Kommireddy Guru Vardhan Reddy",
        "registerNumber": "99220040578",
        "email": "99220040578@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "K. Nagalinga",
        "registerNumber": "99220040590",
        "email": "99220040590@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Kuduthur Pradeep",
        "registerNumber": "99220040591",
        "email": "99220040591@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Madugonda Pandu Ranga",
        "registerNumber": "99220040614",
        "email": "99220040614@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Mandepudi Sri Ram Sai",
        "registerNumber": "99220040623",
        "email": "99220040623@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Thottempudi Sruthi",
        "registerNumber": "99220040755",
        "email": "99220040755@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Varigi Charaneswar Reddy",
        "registerNumber": "99220040765",
        "email": "9922040765@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Kamatam Lokesh",
        "registerNumber": "99220040876",
        "email": "99220040876@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Nagapuri Yashwanth",
        "registerNumber": "99220040937",
        "email": "99220040937@klu.ac.in",
        "department": "CSE(AIML)",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Nagulapati Harshavardhan Reddy",
        "registerNumber": "99220040940",
        "email": "99220040940@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Naidu Lokesh Chowdary",
        "registerNumber": "99220040941",
        "email": "99220040941@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Namala Naga Harshitha",
        "registerNumber": "99220040946",
        "email": "99220040946@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Rapuru Hareen Reddy",
        "registerNumber": "99220040980",
        "email": "99220040980@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Vijayaragavan G",
        "registerNumber": "99220041057",
        "email": "99220041057@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Alluri Venkata Lakshman",
        "registerNumber": "99220041098",
        "email": "99220041098@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Bapatla Venkata Gangadhar",
        "registerNumber": "99220041123",
        "email": "99220041123@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "K Sai Prakash Reddy",
        "registerNumber": "99220041216",
        "email": "99220041216@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "K Shankar Reddy",
        "registerNumber": "99220041233",
        "email": "99220041233@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Nandyala Peddireddy",
        "registerNumber": "99220041273",
        "email": "99220041273@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Gade Bhumika",
        "registerNumber": "99220041472",
        "email": "99220041472@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Girinath G",
        "registerNumber": "99220041478",
        "email": "99220041478@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "K. Jaya Shree",
        "registerNumber": "99220041493",
        "email": "99220041493@klu.ac.in",
        "department": "CSE(AIML)",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Kalari Hanusha",
        "registerNumber": "99220041497",
        "email": "99220041497@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Kolluru Hemanth",
        "registerNumber": "99220041514",
        "email": "99220041514@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Maddukuri Naga Tanuja",
        "registerNumber": "99220041521",
        "email": "99220041521@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Munaga Venkata Rakesh",
        "registerNumber": "99220041533",
        "email": "99220041533@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "99220041554@klu.ac.in",
        "registerNumber": "99220041554",
        "email": "99220041554@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "R Venkata Narayana",
        "registerNumber": "99220041559",
        "email": "99220041559@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Sanjay Uppalapati",
        "registerNumber": "99220041569",
        "email": "99220041569@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Dasari Sushmanth",
        "registerNumber": "99220041626",
        "email": "99220041626@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Gangala Deepchend",
        "registerNumber": "99220041654",
        "email": "99220041654@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Hari Sankar T U",
        "registerNumber": "99220041778",
        "email": "99220041778@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Kavin Loyola S",
        "registerNumber": "99220041806",
        "email": "99220041806@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Thota Durga Prasad",
        "registerNumber": "99220041818",
        "email": "99220041818@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Gopireddy Venkata Bhuvana Chandra Reddy",
        "registerNumber": "99220041857",
        "email": "99220041857@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Ganaparthi Manish",
        "registerNumber": "99220041878",
        "email": "99220041878@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Hari Prasath RK",
        "registerNumber": "99220042005",
        "email": "99220042005@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "N. Sanjeeva Saikumar",
        "registerNumber": "99220042088",
        "email": "99220042088@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "P. Charan Kumar",
        "registerNumber": "99220042089",
        "email": "99220042089@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Manikanta",
        "registerNumber": "9922005027",
        "email": "9922005027@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Gangapalli Harathi",
        "registerNumber": "9922005034",
        "email": "9922005034@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Jeyaharikaran DJ",
        "registerNumber": "9922005038",
        "email": "9922005038@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Kunchepu Lokesh",
        "registerNumber": "9922005045",
        "email": "9922005045@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "K. Bala Gopiraju",
        "registerNumber": "9922005046",
        "email": "9922005046@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "L. Mohana Satya Priya",
        "registerNumber": "9922005048",
        "email": "9922005048@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Menati Lokeshwar",
        "registerNumber": "9922005053",
        "email": "9922005053@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Shailesh N S",
        "registerNumber": "9922005068",
        "email": "9922005068@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Kedareswar T",
        "registerNumber": "9922005072",
        "email": "9922005072@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "B Charantej",
        "registerNumber": "9922005088",
        "email": "9922005088@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Ganta Dheemanth Chowdary",
        "registerNumber": "9922005100",
        "email": "9922005100@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "N Pavan Kumar Reddy",
        "registerNumber": "9922005134",
        "email": "9922005134@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "P. Sreenath Reddy",
        "registerNumber": "9922005138",
        "email": "9922005138@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Bandarupalli Sesha Giri Rao",
        "registerNumber": "9922005173",
        "email": "9922005173@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Chamarthi Venkata Sai Pavan Kumar",
        "registerNumber": "9922005179",
        "email": "9922005179@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Tarun Teja Kolamala",
        "registerNumber": "9922005199",
        "email": "9922005199@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "N Tharun Keshav Reddy",
        "registerNumber": "9922005224",
        "email": "9922005224@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "T Govardhan Reddy",
        "registerNumber": "9922005250",
        "email": "9922005250@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Theegala Narendra",
        "registerNumber": "9922005252",
        "email": "9922005252@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "D Ajay Dheeraj",
        "registerNumber": "9922005275",
        "email": "9922005275@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Vadra Anji Reddy",
        "registerNumber": "9922005294",
        "email": "9922005294@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Y.M.V. Vardhan",
        "registerNumber": "9922005295",
        "email": "9922005295@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Thoka Gopi",
        "registerNumber": "9922005410",
        "email": "9922005410@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Boobalan M",
        "registerNumber": "9922008023",
        "email": "9922008023@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Kaleeswaran M",
        "registerNumber": "9922008040",
        "email": "9922008040@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Karthick S",
        "registerNumber": "9922008044",
        "email": "9922008044@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Lakshmipriya D",
        "registerNumber": "9922008047",
        "email": "9922008047@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Rishikumar P",
        "registerNumber": "9922008061",
        "email": "9922008061@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Sonith S",
        "registerNumber": "9922008072",
        "email": "9922008072@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "P. Thanush Kumar",
        "registerNumber": "9922008073",
        "email": "9922008073@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "T. Naga Chandra Shekar Reddy",
        "registerNumber": "9922008074",
        "email": "9922008074@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Vishnu Chandran N D",
        "registerNumber": "9922008077",
        "email": "9922008077@klu.ac.in",
        "department": "IT-A",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Purushotham Chakali",
        "registerNumber": "9922008102",
        "email": "9922008102@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Hemachandravijay M",
        "registerNumber": "9922008112",
        "email": "9922008112@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Revanth V",
        "registerNumber": "9922008153",
        "email": "9922008153@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Sanjeev Kumar P K",
        "registerNumber": "9922008158",
        "email": "9922008158@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Mohan Varshith",
        "registerNumber": "9922008163",
        "email": "9922008163@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Indlamuri Yamini Sri",
        "registerNumber": "9922008211",
        "email": "9922008211@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Jothi Manikandan M",
        "registerNumber": "9922008214",
        "email": "9922008214@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Miruthula Priya S",
        "registerNumber": "9922008228",
        "email": "9922008228@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Muthuvijayan M",
        "registerNumber": "9922008231",
        "email": "9922008231@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Raja Mohit Venkata Sai Saketh",
        "registerNumber": "9922008249",
        "email": "9922008249@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Sanjay Kumar K",
        "registerNumber": "9922008257",
        "email": "9922008257@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Yogesh M",
        "registerNumber": "9922008278",
        "email": "9922008278@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "S. Madhesh Kumar",
        "registerNumber": "9922008313",
        "email": "9922008313@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Gokulraj E",
        "registerNumber": "9922008322",
        "email": "9922008322@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Surya V",
        "registerNumber": "9922008328",
        "email": "9922008328@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Logesh G",
        "registerNumber": "9922008335",
        "email": "9922008335@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Moohamed Sameer M",
        "registerNumber": "9922008338",
        "email": "9922008338@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Billy Daniel W",
        "registerNumber": "9922008346",
        "email": "9922008346@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Konasani Mourya",
        "registerNumber": "9922008348",
        "email": "9922008348@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Sarathi SA",
        "registerNumber": "9922008353",
        "email": "9922008353@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Balasubramaniyaraja C",
        "registerNumber": "9922008363",
        "email": "9922008363@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Devi BLM",
        "registerNumber": "9922008364",
        "email": "9922008364@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Goutham Balaji",
        "registerNumber": "9922008366",
        "email": "9922008366@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Harish Kumar S",
        "registerNumber": "9922008367",
        "email": "9922008367@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Mohamed Najeeb N",
        "registerNumber": "9922008370",
        "email": "9922008370@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Piyush Kumar",
        "registerNumber": "9922008371",
        "email": "9922008371@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Battula Vasanth",
        "registerNumber": "9922008407",
        "email": "9922008407@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "T. Mathankumar",
        "registerNumber": "9922008414",
        "email": "9922008414@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Manikandan M",
        "registerNumber": "9922008418",
        "email": "9922008418@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Sundara Pandian P",
        "registerNumber": "9922008431",
        "email": "9922008431@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Santhanakumar M",
        "registerNumber": "9922008437",
        "email": "9922008437@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Dharshan Kumar",
        "registerNumber": "9922008448",
        "email": "9922008448@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Sivamonish N",
        "registerNumber": "9922008451",
        "email": "9922008451@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Syed Mohamed Aashif S",
        "registerNumber": "9922008467",
        "email": "9922008467@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Sakshi Thakur",
        "registerNumber": "9922020005",
        "email": "9922020005@klu.ac.in",
        "department": "Biomedical",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "M. Mohasin",
        "registerNumber": "99230040038",
        "email": "99230040038@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "P. Manasa",
        "registerNumber": "99230040048",
        "email": "99230040048@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "Atteppagari Hareesh Kumar",
        "registerNumber": "99230040076",
        "email": "99230040076@klu.ac.in",
        "department": "CSE(AIML)",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "Bethapudi Rupesh",
        "registerNumber": "99230040082",
        "email": "99230040082@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "B. Vishnu Vardhan Reddy",
        "registerNumber": "99230040090",
        "email": "99230040090@klu.ac.in",
        "department": "CSE(AIML)",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "G. Venkata Gopi",
        "registerNumber": "99230040102",
        "email": "99230040102@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "T Mohan Reddy",
        "registerNumber": "99230040178",
        "email": "99230040178@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "Kotapati Naveen",
        "registerNumber": "99230040202",
        "email": "99230040202@klu.ac.in",
        "department": "CSE(DS)",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "Mohammad Sajid",
        "registerNumber": "99230040214",
        "email": "99230040214@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "Galam Harish",
        "registerNumber": "99230040224",
        "email": "99230040224@klu.ac.in",
        "department": "CES-AIML",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "Mandaluru Babji",
        "registerNumber": "99230040229",
        "email": "99230040229@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "Kudumula Vamshi Krishna Reddy",
        "registerNumber": "99230040237",
        "email": "99230040237@klu.ac.in",
        "department": "CSE(AIML)",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "Bhavya",
        "registerNumber": "99230040274",
        "email": "99230040274@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "Dasari Jyothi Venkata Sai Srinivas",
        "registerNumber": "99230040290",
        "email": "99230040290@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "Chandrasen K",
        "registerNumber": "99230040333",
        "email": "99230040333@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "Charan",
        "registerNumber": "99230040358",
        "email": "99230040358@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "R Vamsi Krishna",
        "registerNumber": "99230040415",
        "email": "99230040415@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "Sanda Saibalaji",
        "registerNumber": "99230040417",
        "email": "99230040417@klu.ac.in",
        "department": "CSE(AIML)",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "G. Hari Prasad",
        "registerNumber": "99230040542",
        "email": "99230040542@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "Jampani Chandramouli",
        "registerNumber": "99230040573",
        "email": "99230040573@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "J Sri Vishnu",
        "registerNumber": "99230040575",
        "email": "99230040575@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "P Varsha",
        "registerNumber": "99230040726",
        "email": "99230040726@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "R Sanjay Raju",
        "registerNumber": "99230040743",
        "email": "99230040743@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "K. Chandra Sekhar",
        "registerNumber": "99230040840",
        "email": "99230040840@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "Unregistered Student",
        "registerNumber": "99230040850",
        "email": "99230040850@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "Kalva Gunasree",
        "registerNumber": "99230040973",
        "email": "99230040973@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "Sabari Kumar V G",
        "registerNumber": "99230041142",
        "email": "99230041142@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "Kamalaa Sri M",
        "registerNumber": "99230041180",
        "email": "99230041180@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "M. Bhanu Teja Reddy",
        "registerNumber": "99230041181",
        "email": "99230041181@klu.ac.in",
        "department": "CSE(AIML)",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "K Ghandeev Raj",
        "registerNumber": "99230041228",
        "email": "99230041228@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "T.V. Harshavardhan",
        "registerNumber": "99230041270",
        "email": "99230041270@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "Golla Mahesh",
        "registerNumber": "9923005082",
        "email": "9923005082@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "Papisetty Anushka",
        "registerNumber": "9923005116",
        "email": "9923005116@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "Aarthika S",
        "registerNumber": "9923005269",
        "email": "9923005269@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "J. Jeyanitha",
        "registerNumber": "9923005271",
        "email": "9923005271@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "Kanniga M",
        "registerNumber": "9923005272",
        "email": "9923005272@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "Karthika G",
        "registerNumber": "9923005273",
        "email": "9923005273@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "R. Bhuvaneshwari",
        "registerNumber": "9923005283",
        "email": "9923005283@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "K. Roshini",
        "registerNumber": "9923005297",
        "email": "9923005297@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "Chitra Manoj Kumar",
        "registerNumber": "9923005313",
        "email": "9923005313@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "Vijaya Vasan V",
        "registerNumber": "9923008081",
        "email": "9923008081@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "Ahsan Najeeba M",
        "registerNumber": "9923008122",
        "email": "9923008122@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "Srinithi D",
        "registerNumber": "9923008138",
        "email": "9923008138@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "Varshitha M",
        "registerNumber": "9924001022",
        "email": "9924001022@klu.ac.in",
        "department": "Biotech",
        "yearOfStudy": "2",
        "role": "student"
    },
    {
        "name": "Gurru Ganesh S K",
        "registerNumber": "9924005056",
        "email": "9924005056@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "2",
        "role": "student"
    },
    {
        "name": "P. Joban",
        "registerNumber": "9924005076",
        "email": "9924005076@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "2",
        "role": "student"
    },
    {
        "name": "R. Prasanna",
        "registerNumber": "9924005136",
        "email": "9924005136@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "2",
        "role": "student"
    },
    {
        "name": "Ragu Balan A",
        "registerNumber": "9924005137",
        "email": "9924005137@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "2",
        "role": "student"
    },
    {
        "name": "Arun Indhu M",
        "registerNumber": "9924005183",
        "email": "9924005183@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "2",
        "role": "student"
    },
    {
        "name": "Gokul B",
        "registerNumber": "9924005376",
        "email": "9924005376@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "2",
        "role": "student"
    },
    {
        "name": "R Sridharan",
        "registerNumber": "9924005460",
        "email": "9924005460@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "2",
        "role": "student"
    },
    {
        "name": "Yashwanth Gunasekaran",
        "registerNumber": "9924008040",
        "email": "9924008040@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "2",
        "role": "student"
    },
    {
        "name": "Devagiri Jeevan Reddy",
        "registerNumber": "9924008077",
        "email": "9924008077@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "2",
        "role": "student"
    },
    {
        "name": "Rayala Vamsi",
        "registerNumber": "9924008083",
        "email": "9924008083@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "2",
        "role": "student"
    },
    {
        "name": "Thepireddy Vishnuvardhan Reddy",
        "registerNumber": "9924008086",
        "email": "9924008086@gmail.com",
        "department": "IT",
        "yearOfStudy": "2",
        "role": "student"
    },
    {
        "name": "Kancherla Surya Sai Teja",
        "registerNumber": "9924008091",
        "email": "9924008091@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "2",
        "role": "student"
    },
    {
        "name": "Medida Phanindra Reddy",
        "registerNumber": "9924008102",
        "email": "9924008102@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "2",
        "role": "student"
    },
    {
        "name": "Vemula Chenchu Naga Venkata Tharun Sai",
        "registerNumber": "9924008127",
        "email": "9924008127@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "2",
        "role": "student"
    },
    {
        "name": "V. Yashvanth Kumar Reddy",
        "registerNumber": "9924008129",
        "email": "9924008129@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "2",
        "role": "student"
    },
    {
        "name": "Ashmi Narayana Perumal",
        "registerNumber": "9924011001",
        "email": "9924011001@klu.ac.in",
        "department": "Food Technology",
        "yearOfStudy": "2",
        "role": "student"
    },
    {
        "name": "Kishore Kumar S",
        "registerNumber": "9924011035",
        "email": "9924011035@klu.ac.in",
        "department": "Food Technology",
        "yearOfStudy": "2",
        "role": "student"
    },
    {
        "name": "Shakunth C",
        "registerNumber": "9924011056",
        "email": "9924011056@klu.ac.in",
        "department": "Food Technology",
        "yearOfStudy": "2",
        "role": "student"
    },
    {
        "name": "Mahil",
        "registerNumber": "9988776655",
        "email": "9988776655@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "2",
        "role": "student"
    },
    {
        "name": "V.Akhil",
        "registerNumber": "99220041410",
        "email": "99220041410@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "4",
        "role": "student"
    }
];

const seedData = async () => {
    try {
        await connectDB();

        console.log('🌱 Starting database seeding...\n');

        // 1. Admin Logic (Additive)
        const adminEmail = process.env.ADMIN_EMAIL;
        const existingAdmin = await User.findOne({ email: adminEmail });
        if (!existingAdmin) {
            console.log('\nCreating new admin...');
            await User.create({
                registerNumber: process.env.ADMIN_REGISTER_NUMBER,
                email: adminEmail,
                password: process.env.ADMIN_PASSWORD,
                name: 'System Administrator',
                role: 'admin'
            });
            console.log(`✅ Admin created: ${adminEmail}`);
        } else {
            console.log(`✅ Admin already exists: ${adminEmail}`);
        }

        // 2. Student Logic (Additive & Unique)
        console.log('\nProcessing students...');

        // Deduplicate source array based on registerNumber
        const uniqueSourceStudents = new Map();
        studentsData.forEach(s => {
            if (s.registerNumber) uniqueSourceStudents.set(s.registerNumber, s);
        });

        let added = 0;
        let skipped = 0;

        for (const studentData of uniqueSourceStudents.values()) {
            const exists = await User.findOne({ registerNumber: studentData.registerNumber });
            if (exists) {
                skipped++;
                continue;
            }

            const student = {
                ...studentData,
                password: studentData.registerNumber
            };

            await User.create(student);
            console.log(`✓ Added student: ${student.registerNumber} - ${student.name}`);
            added++;
        }
        console.log(`\nUser Sync Complete: Added ${added}, Skipped ${skipped}`);

        // 3. preserve existing days and sessions
        console.log('\nℹ️  Skipping Day/Session reset to preserve existing data.');
        console.log('   (To reset sessions/attendance, use a separate cleanup script or revert this change in seed.js)');

        // Get total count
        const totalUsers = await User.countDocuments();

        console.log('\n✅ Database seeding completed successfully!');
        console.log('\n📋 Summary:');
        console.log(`   New Users Added: ${added}`);
        console.log(`   Existing Users Skipped: ${skipped}`);
        console.log(`   Total Users in DB: ${totalUsers}`);
        console.log(`   Login Rule: Password = Register Number`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

seedData();
