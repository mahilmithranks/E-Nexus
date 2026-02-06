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
        "name": "99220041554@kly.ac.in",
        "registerNumber": "99220041554",
        "email": "99220041554@kly.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
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
        "name": "B Charantej",
        "registerNumber": "9922005088",
        "email": "9922005088@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "B.Vishnu Vardhan Reddy",
        "registerNumber": "99230040090",
        "email": "99230040090@klu.ac.in",
        "department": "CSE(AIML)",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "Balasubramaniyaraja C",
        "registerNumber": "9922008363",
        "email": "9922008363@klu.ac.in",
        "department": "Information Technology",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "BANDARUPALLI SESHA GIRI RAO",
        "registerNumber": "9922005173",
        "email": "9922005173@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "BATTULA VASANTH",
        "registerNumber": "9922008407",
        "email": "9922008407@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "BEENAPATI MADHUSUDHAN REDDY",
        "registerNumber": "99220040452",
        "email": "99220040452@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Billy Daniel W",
        "registerNumber": "9922008346",
        "email": "9922008346@klu.ac.in",
        "department": "Information Technology",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Boobalan M",
        "registerNumber": "9922008023",
        "email": "9922008023@klu.ac.in",
        "department": "BTech IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Chamarthi Venkata Sai Pavan Kumar",
        "registerNumber": "9922005179",
        "email": "9922005179@klu.ac.in",
        "department": "Electronics and communication Engineering",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "CHEBOLU GANESH PAVAN SAI",
        "registerNumber": "99220040469",
        "email": "99220040469@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "D Ajay dheeraj",
        "registerNumber": "9922005275",
        "email": "9922005275@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Devi BLM",
        "registerNumber": "9922008364",
        "email": "9922008364@klu.ac.in",
        "department": "Information Technology",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "DEVIREDDY JITHENDRA REDDY",
        "registerNumber": "99220040489",
        "email": "99220040489@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "GALAM HARISH",
        "registerNumber": "99230040224",
        "email": "99230040224@klu.ac.in",
        "department": "CES-AIML",
        "yearOfStudy": "3",
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
        "name": "Ganta Dheemanth Chowdary",
        "registerNumber": "9922005100",
        "email": "9922005100@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "GAVINI RAMAKRISHNA",
        "registerNumber": "99220040057",
        "email": "99220040057@klu.ac.in",
        "department": "CSE",
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
        "name": "GOPAL KUMAR",
        "registerNumber": "99220040063",
        "email": "99220040063@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Gopireddy Venkata Bhuvana Chandra reddy",
        "registerNumber": "99220041857",
        "email": "99220041857@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Goutham balaji",
        "registerNumber": "9922008366",
        "email": "9922008366@klu.ac.in",
        "department": "Btech IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "HARI PRASATH RK",
        "registerNumber": "99220042005",
        "email": "99220042005@klu.ac.in",
        "department": "Cse",
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
        "name": "Harish Kumar S",
        "registerNumber": "9922008367",
        "email": "9922008367@klu.ac.in",
        "department": "Information Technology",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Jothi Manikandan M",
        "registerNumber": "9922008214",
        "email": "9922008214@klu.ac.in",
        "department": "B. Tec IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "K Ghandeev raj",
        "registerNumber": "99230041228",
        "email": "99230041228@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "3",
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
        "name": "K.Bala Gopiraju",
        "registerNumber": "9922005046",
        "email": "9922005046@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "K.Jaya Shree",
        "registerNumber": "99220041493",
        "email": "99220041493@klu.ac.in",
        "department": "CSE(AIML)",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "K.Roshini",
        "registerNumber": "9923005297",
        "email": "9923005297@klu.ac.in",
        "department": "Electronics and communication engineering",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "K.Sai Prakash Reddy",
        "registerNumber": "99220041216",
        "email": "99220041216@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Kaleeswaran M",
        "registerNumber": "9922008040",
        "email": "9922008040@klu.ac.in",
        "department": "B.tech IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Kalva Gunasree",
        "registerNumber": "99230040973",
        "email": "99230040973@klu.ac.in",
        "department": "Cse",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "KARTHICK S",
        "registerNumber": "9922008044",
        "email": "9922008044@klu.ac.in",
        "department": "B.Tech Information Technology",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Kedareswar T",
        "registerNumber": "9922005072",
        "email": "9922005072@klu.ac.in",
        "department": "Ece",
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
        "name": "Konasani Mourya",
        "registerNumber": "9922008348",
        "email": "9922008348@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "KONDRAJU MANEESH",
        "registerNumber": "99220040400",
        "email": "99220040400@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Kotapati Naveen",
        "registerNumber": "99230040202",
        "email": "99230040202@klu.ac.in",
        "department": "CSE (DS)",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "Kovvur Priyanka",
        "registerNumber": "9823005005",
        "email": "9823005005@klu.ac.in",
        "department": "Electronics and Communication Engineering",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "KUDUMULA VAMSHI KRISHNA REDDY",
        "registerNumber": "99230040237",
        "email": "99230040237@klu.ac.in",
        "department": "CSE(AIML)",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "KUNCHEPU LOKESH",
        "registerNumber": "9922005045",
        "email": "9922005045@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "L.Mohana Satya Priya",
        "registerNumber": "9922005048",
        "email": "9922005048@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Lakshin prabhu S",
        "registerNumber": "99220040296",
        "email": "99220040296@klu.ac.in",
        "department": "Cse",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Lakshmipriya D",
        "registerNumber": "9922008047",
        "email": "9922008047@klu.ac.in",
        "department": "Information Technology",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Logesh G",
        "registerNumber": "9922008335",
        "email": "9922008335@klu.ac.in",
        "department": "Information technology",
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
        "name": "M.Bhanu teja reddy",
        "registerNumber": "99230041181",
        "email": "99230041181@klu.ac.in",
        "department": "Cse(AIML)",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "M.Surya Teja",
        "registerNumber": "9921005093",
        "email": "9921005093@klu.ac.in",
        "department": "ECE",
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
        "name": "Maddukuri Naga Tanuja",
        "registerNumber": "99220041521",
        "email": "99220041521@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "MANDALURU BABJI",
        "registerNumber": "99230040229",
        "email": "99230040229@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "3",
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
        "name": "Manikandan M",
        "registerNumber": "9922008418",
        "email": "9922008418@klu.ac.in",
        "department": "Information Technology",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "manikanta",
        "registerNumber": "9922005027",
        "email": "9922005027@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "MEGHANA JAYARAM",
        "registerNumber": "99220040549",
        "email": "99220040549@klu.ac.in",
        "department": "CSE",
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
        "name": "Miruthula Priya S",
        "registerNumber": "9922008228",
        "email": "9922008228@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Mohamed Musthafa S",
        "registerNumber": "99220040402",
        "email": "99220040402@klu.ac.in",
        "department": "Btech CSE(Aiml)",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Mohamed Najeeb N",
        "registerNumber": "9922008370",
        "email": "9922008370@klu.ac.in",
        "department": "B.tech information technology",
        "yearOfStudy": "4",
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
        "name": "Monfort Joel J",
        "registerNumber": "99220040308",
        "email": "99220040308@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "MOOHAMED SAMEER M",
        "registerNumber": "9922008338",
        "email": "9922008338@klu.ac.in",
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
        "name": "N.pavan kumar reddy",
        "registerNumber": "9922005134",
        "email": "9922005134@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "N.Sanjeeva Saikumar",
        "registerNumber": "99220042088",
        "email": "99220042088@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "N.Tharun keshav reddy",
        "registerNumber": "9922005224",
        "email": "9922005224@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Nag ulapati Harshavardhan Reddy",
        "registerNumber": "99220040940",
        "email": "99220040940@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "NAGAPURI YASHWANTH",
        "registerNumber": "99220040937",
        "email": "99220040937@klu.ac.in",
        "department": "CSE(AIML)",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "NAIDU LOKESH CHOWDARY",
        "registerNumber": "99220040941",
        "email": "99220040941@klu.ac.in",
        "department": "Cse",
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
        "name": "NAMBURI AJAY",
        "registerNumber": "99220040315",
        "email": "99220040315@klu.ac.in",
        "department": "Cse",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "NANDIGAM SOUNDARYA",
        "registerNumber": "99220040316",
        "email": "99220040316@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "NANDYALA PEDDIREDDY",
        "registerNumber": "99220041273",
        "email": "99220041273@klu.ac.in",
        "department": "Cse",
        "yearOfStudy": "4",
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
        "name": "P.Charan Kumar",
        "registerNumber": "99220042089",
        "email": "99220042089@klu.ac.in",
        "department": "Cse",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "P.Sreenath Reddy",
        "registerNumber": "9922005138",
        "email": "9922005138@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "P.Thanush kumar",
        "registerNumber": "9922008073",
        "email": "9922008073@klu.ac.in",
        "department": "Information technology",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "R Sanjay raju",
        "registerNumber": "99230040743",
        "email": "99230040743@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "3",
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
        "name": "Rishikumar P",
        "registerNumber": "9922008061",
        "email": "9922008061@klu.ac.in",
        "department": "B tech IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Sanjay kumar k",
        "registerNumber": "9922008257",
        "email": "9922008257@klu.ac.in",
        "department": "B-tech information technology",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Santhanakumar M",
        "registerNumber": "9922008437",
        "email": "9922008437@klu.ac.in",
        "department": "B.Tech IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Sarathi SA",
        "registerNumber": "9922008353",
        "email": "9922008353@klu.ac.in",
        "department": "B Tech IT",
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
        "name": "Sivamonish N",
        "registerNumber": "9922008451",
        "email": "9922008451@klu.ac.in",
        "department": "B.tech IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Sumanth reddy Yadapalli",
        "registerNumber": "99220040377",
        "email": "99220040377@klu.ac.in",
        "department": "Cse",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Surya.V",
        "registerNumber": "9922008328",
        "email": "9922008328@klu.ac.in",
        "department": "B.Tech IT",
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
        "name": "T GOVARDHAN REDDY",
        "registerNumber": "9922005250",
        "email": "9922005250@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "T.Mathankumar",
        "registerNumber": "9922008414",
        "email": "9922008414@klu.ac.in",
        "department": "Btech it",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "T.naga chandra shekar reddy",
        "registerNumber": "9922008074",
        "email": "9922008074@klu.ac.in",
        "department": "IT",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "T.V. Harshavardhan",
        "registerNumber": "99230041270",
        "email": "99230041270@klu.ac.in",
        "department": "Cse",
        "yearOfStudy": "3",
        "role": "student"
    },
    {
        "name": "TARUN TEJA KOLAMALA",
        "registerNumber": "9922005199",
        "email": "9922005199@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "UDAYAPRAKASH B",
        "registerNumber": "99220040215",
        "email": "99220040215@klu.ac.in",
        "department": "CSE",
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
        "name": "Varigi Charaneswar Reddy",
        "registerNumber": "99220040765",
        "email": "9922040765@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Vishnu Chandran N D",
        "registerNumber": "9922008077",
        "email": "9922008077@klu.ac.in",
        "department": "Information Technology",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Y.M.V.VARDHAN",
        "registerNumber": "9922005295",
        "email": "9922005295@klu.ac.in",
        "department": "ECE",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Yogesh M",
        "registerNumber": "9922008278",
        "email": "9922008278@klu.ac.in",
        "department": "Information technology",
        "yearOfStudy": "4",
        "role": "student"
    },
    {
        "name": "Mahil",
        "registerNumber": "9988776655",
        "email": "9988776655@klu.ac.in",
        "department": "CSE",
        "yearOfStudy": "2",
        "role": "student"
    }
];

const seedData = async () => {
    try {
        await connectDB();

        console.log('🌱 Starting database seeding...\n');

        // Clear existing students only (Keep admins)
        await User.deleteMany({ role: 'student' });
        console.log('🧹 Cleared existing student records');

        // Clear existing students and admins (to refresh with latest from .env)
        console.log('🧹 Clearing existing users...');
        await User.deleteMany({}); // Delete ALL users for a truly clean slate
        console.log('✅ All existing users removed');

        // Create new admin from .env
        console.log('\nCreating new admin...');
        await User.create({
            registerNumber: process.env.ADMIN_REGISTER_NUMBER,
            email: process.env.ADMIN_EMAIL,
            password: process.env.ADMIN_PASSWORD,
            name: 'System Administrator',
            role: 'admin'
        });
        console.log(`✅ Admin created: ${process.env.ADMIN_EMAIL}`);

        // Create students
        console.log('\nCreating students...');
        for (const studentData of studentsData) {
            // Password is set to registerNumber as per requirements
            const student = {
                ...studentData,
                password: studentData.registerNumber
            };

            await User.create(student);
            console.log(`✓ Created student: ${student.registerNumber} - ${student.name}`);
        }

        // Clear existing days and sessions to start fresh with original data
        await Day.deleteMany({});
        await Session.deleteMany({});
        await Attendance.deleteMany({});
        await AssignmentSubmission.deleteMany({});
        console.log('🧹 Cleared existing days, sessions, attendance, and assignment records');

        // Create workshop days
        const days = [
            {
                dayNumber: 1,
                title: 'Git & GitHub (Version Control), Infosys: AI for Data Analytics (30 Hours)',
                status: 'LOCKED',
                date: new Date('2026-02-10')
            },
            { dayNumber: 2, title: 'MongoDB Connection & Integration (Hands-on)', status: 'LOCKED', date: new Date('2026-02-11') },
            { dayNumber: 3, title: 'Prompt Frameworks & Edge AI', status: 'LOCKED', date: new Date('2026-02-12') },
            { dayNumber: 4, title: 'No-Code AI Tools', status: 'LOCKED', date: new Date('2026-02-13') },
            { dayNumber: 5, title: 'Software Design & Development (SDD)', status: 'LOCKED', date: new Date('2026-02-17') },
            { dayNumber: 6, title: 'MERN Stacks', status: 'LOCKED', date: new Date('2026-02-18') },
            { dayNumber: 7, title: 'GEN AI', status: 'LOCKED', date: new Date('2026-02-19') },
            { dayNumber: 8, title: 'Workflow Automation (n8n) & Linux Foundations', status: 'LOCKED', date: new Date('2026-02-21') }
        ];

        console.log('\nCreating workshop days...');
        const createdDays = [];
        for (const dayData of days) {
            const day = await Day.create(dayData);
            createdDays.push(day);
            console.log(`✓ Created Day ${day.dayNumber}: ${day.title}`);
        }

        // Create sessions for Day 1
        const day1 = createdDays[0];
        const sessionsForDay1 = [
            {
                dayId: day1._id,
                title: 'Infosys Certified Course',
                description: 'Online (Self-paced) | AI for Data Analytics & Business Intelligence | 30 Hours (Complete before live sessions)',
                attendanceOpen: false,
                mode: 'ONLINE',
                startTime: new Date('2026-02-10T00:00:00'),
                endTime: new Date('2026-02-10T23:59:59'),
                attendanceEndTime: new Date('2026-02-11T23:59:59'),
                assignments: [
                    {
                        title: 'Course Completion Certificate',
                        type: 'file',
                        description: 'Upload your Infosys course completion certificate'
                    }
                ]
            },
            {
                dayId: day1._id,
                title: 'Introduction, Commands, CLI, Repo',
                description: 'Day 1 Training: Fundamental Git concepts and operations',
                attendanceOpen: false,
                startTime: new Date('2026-02-10T18:00:00'),
                endTime: new Date('2026-02-10T19:00:00'),
                attendanceStartTime: new Date('2026-02-10T18:00:00'),
                attendanceEndTime: new Date('2026-02-10T18:15:00'),
                mode: 'ONLINE',
                assignments: [
                    {
                        title: 'GitHub Repository Link',
                        type: 'link',
                        description: 'Share your first repository link'
                    }
                ]
            },
            {
                dayId: day1._id,
                title: 'Opensource Startups',
                description: 'Day 1 Training: Understanding open source ecosystem',
                attendanceOpen: false,
                startTime: new Date('2026-02-10T19:00:00'),
                endTime: new Date('2026-02-10T20:00:00'),
                attendanceStartTime: new Date('2026-02-10T19:00:00'),
                attendanceEndTime: new Date('2026-02-10T19:15:00'),
                mode: 'ONLINE',
                assignments: [
                    {
                        title: 'Contribution Ideas',
                        type: 'text',
                        description: 'List 3 open source projects you would like to contribute to'
                    }
                ]
            },
            {
                dayId: day1._id,
                title: 'Assessment',
                description: 'Day 1 Training: Quick check of today\'s learnings',
                attendanceOpen: false,
                startTime: new Date('2026-02-10T20:00:00'),
                endTime: new Date('2026-02-10T21:00:00'),
                attendanceStartTime: new Date('2026-02-10T20:00:00'),
                attendanceEndTime: new Date('2026-02-10T20:15:00'),
                mode: 'ONLINE',
                assignments: [
                    {
                        title: 'Day 1 Concept Quiz',
                        type: 'text',
                        description: 'Answer the questions provided during the session'
                    }
                ]
            }
        ];

        for (const sessionData of sessionsForDay1) {
            await Session.create(sessionData);
            console.log(`  ✓ Created session: ${sessionData.title}`);
        }

        // Create sessions for Day 2
        const day2 = createdDays[1];
        const sessionsForDay2 = [
            {
                dayId: day2._id,
                title: 'Introduction, Installation and setup',
                description: 'Day 2 Training: Getting started with MongoDB',
                attendanceOpen: false,
                startTime: new Date('2026-02-11T18:00:00'),
                endTime: new Date('2026-02-11T19:00:00'),
                attendanceStartTime: new Date('2026-02-11T18:00:00'),
                attendanceEndTime: new Date('2026-02-11T18:15:00'),
                mode: 'ONLINE',
                assignments: [
                    {
                        title: 'Installation Proof',
                        type: 'text',
                        description: 'Paste your MongoDB version output'
                    }
                ]
            },
            {
                dayId: day2._id,
                title: 'Using MongoDB atlas compass and making simple node.js project',
                description: 'Day 2 Training: Connecting Node to Mongo',
                attendanceOpen: false,
                startTime: new Date('2026-02-11T19:00:00'),
                endTime: new Date('2026-02-11T20:00:00'),
                attendanceStartTime: new Date('2026-02-11T19:00:00'),
                attendanceEndTime: new Date('2026-02-11T19:15:00'),
                mode: 'ONLINE',
                assignments: [
                    {
                        title: 'Atlas Cluster Screenshot',
                        type: 'file',
                        description: 'Upload a screenshot of your Atlas dashboard'
                    }
                ]
            },
            {
                dayId: day2._id,
                title: 'Assessment',
                description: 'Day 2 Training: Quick check of MongoDB concepts',
                attendanceOpen: false,
                startTime: new Date('2026-02-11T20:00:00'),
                endTime: new Date('2026-02-11T21:00:00'),
                attendanceStartTime: new Date('2026-02-11T20:00:00'),
                attendanceEndTime: new Date('2026-02-11T20:15:00'),
                mode: 'ONLINE',
                assignments: [
                    {
                        title: 'Day 2 Concept Quiz',
                        type: 'text',
                        description: 'Answer the questions provided during the session'
                    }
                ]
            }
        ];

        for (const sessionData of sessionsForDay2) {
            await Session.create(sessionData);
            console.log(`  ✓ Created session: ${sessionData.title}`);
        }

        // Create sessions for Day 3
        const day3 = createdDays[2];
        const sessionsForDay3 = [
            {
                dayId: day3._id,
                title: 'NPC Behavior',
                description: 'Day 3 Training: Designing intelligent characters',
                attendanceOpen: false,
                startTime: new Date('2026-02-12T18:00:00'),
                endTime: new Date('2026-02-12T19:00:00'),
                attendanceStartTime: new Date('2026-02-12T18:00:00'),
                attendanceEndTime: new Date('2026-02-12T18:15:00'),
                mode: 'ONLINE',
                assignments: [
                    {
                        title: 'Behavior Logic Draft',
                        type: 'text',
                        description: 'Write a short prompt for an NPC shopkeeper'
                    }
                ]
            },
            {
                dayId: day3._id,
                title: 'Prompt Frameworks',
                description: 'Day 3 Training: Mastering advanced prompting techniques',
                attendanceOpen: false,
                startTime: new Date('2026-02-12T19:00:00'),
                endTime: new Date('2026-02-12T20:00:00'),
                attendanceStartTime: new Date('2026-02-12T19:00:00'),
                attendanceEndTime: new Date('2026-02-12T19:15:00'),
                mode: 'ONLINE',
                assignments: [
                    {
                        title: 'Framework Application',
                        type: 'text',
                        description: 'Apply the CO-STAR framework to a task'
                    }
                ]
            },
            {
                dayId: day3._id,
                title: 'Assessment',
                description: 'Day 3 Training: Quick check of Prompting & Edge AI concepts',
                attendanceOpen: false,
                startTime: new Date('2026-02-12T20:00:00'),
                endTime: new Date('2026-02-12T21:00:00'),
                attendanceStartTime: new Date('2026-02-12T20:00:00'),
                attendanceEndTime: new Date('2026-02-12T20:15:00'),
                mode: 'ONLINE',
                assignments: [
                    {
                        title: 'Day 3 Concept Quiz',
                        type: 'text',
                        description: 'Answer the questions provided during the session'
                    }
                ]
            }
        ];

        for (const sessionData of sessionsForDay3) {
            await Session.create(sessionData);
            console.log(`  ✓ Created session: ${sessionData.title}`);
        }

        // Create sessions for Day 4
        const day4 = createdDays[3];
        const sessionsForDay4 = [
            {
                dayId: day4._id,
                title: 'Cursor, Copilot',
                description: 'Day 4 Training: Speeding up development with AI extensions',
                attendanceOpen: false,
                startTime: new Date('2026-02-13T18:00:00'),
                endTime: new Date('2026-02-13T19:00:00'),
                attendanceStartTime: new Date('2026-02-13T18:00:00'),
                attendanceEndTime: new Date('2026-02-13T18:15:00'),
                mode: 'ONLINE',
                assignments: [{ title: 'AI Code Snapshot', type: 'text', description: 'Paste a code snippet generated via Cursor/Copilot' }]
            },
            {
                dayId: day4._id,
                title: 'Replit, Orchids',
                description: 'Day 4 Training: Cloud development and automated workflows',
                attendanceOpen: false,
                startTime: new Date('2026-02-13T19:00:00'),
                endTime: new Date('2026-02-13T20:00:00'),
                attendanceStartTime: new Date('2026-02-13T19:00:00'),
                attendanceEndTime: new Date('2026-02-13T19:15:00'),
                mode: 'ONLINE',
                assignments: [{ title: 'Deployment Link', type: 'link', description: 'Share your Replit project link' }]
            },
            {
                dayId: day4._id,
                title: 'Assessment',
                description: 'Day 4 Training: Quick check of No-Code AI tools',
                attendanceOpen: false,
                startTime: new Date('2026-02-13T20:00:00'),
                endTime: new Date('2026-02-13T21:00:00'),
                attendanceStartTime: new Date('2026-02-13T20:00:00'),
                attendanceEndTime: new Date('2026-02-13T20:15:00'),
                mode: 'ONLINE',
                assignments: [{ title: 'Day 4 Quiz', type: 'text', description: 'Complete the quiz' }]
            }
        ];

        for (const sessionData of sessionsForDay4) {
            await Session.create(sessionData);
            console.log(`  ✓ Created session: ${sessionData.title}`);
        }

        // Create sessions for Day 5
        const day5 = createdDays[4];
        const sessionsForDay5 = [
            {
                dayId: day5._id,
                title: 'Introduction and system design',
                description: 'Day 5 Training: Core concepts of SDD',
                attendanceOpen: false,
                startTime: new Date('2026-02-17T18:00:00'),
                endTime: new Date('2026-02-17T19:00:00'),
                attendanceStartTime: new Date('2026-02-17T18:00:00'),
                attendanceEndTime: new Date('2026-02-17T18:15:00'),
                mode: 'ONLINE',
                assignments: [{ title: 'System Requirement List', type: 'text', description: 'List functional and non-functional requirements' }]
            },
            {
                dayId: day5._id,
                title: 'High level design',
                description: 'Day 5 Training: Architecture and components',
                attendanceOpen: false,
                startTime: new Date('2026-02-17T19:00:00'),
                endTime: new Date('2026-02-17T20:00:00'),
                attendanceStartTime: new Date('2026-02-17T19:00:00'),
                attendanceEndTime: new Date('2026-02-17T19:15:00'),
                mode: 'ONLINE',
                assignments: [{ title: 'Architecture Diagram link', type: 'link', description: 'Link to your design diagram (Canva/Excalidraw)' }]
            },
            {
                dayId: day5._id,
                title: 'Low level Design',
                description: 'Day 5 Training: Detailed component design',
                attendanceOpen: false,
                startTime: new Date('2026-02-17T20:00:00'),
                endTime: new Date('2026-02-17T21:00:00'),
                attendanceStartTime: new Date('2026-02-17T20:00:00'),
                attendanceEndTime: new Date('2026-02-17T20:15:00'),
                mode: 'ONLINE',
                assignments: [{ title: 'Schema Design', type: 'text', description: 'Define the database schema' }]
            }
        ];

        for (const sessionData of sessionsForDay5) {
            await Session.create(sessionData);
            console.log(`  ✓ Created session: ${sessionData.title}`);
        }

        // Create sessions for Day 6
        const day6 = createdDays[5];
        const sessionsForDay6 = [
            {
                dayId: day6._id,
                title: 'Frontend',
                description: 'Day 6 Training: Building responsive UI with React',
                attendanceOpen: false,
                startTime: new Date('2026-02-18T18:00:00'),
                endTime: new Date('2026-02-18T19:00:00'),
                attendanceStartTime: new Date('2026-02-18T18:00:00'),
                attendanceEndTime: new Date('2026-02-18T18:15:00'),
                mode: 'ONLINE',
                assignments: [{ title: 'Component Screenshot', type: 'file', description: 'Upload a screenshot of your React component' }]
            },
            {
                dayId: day6._id,
                title: 'Backend',
                description: 'Day 6 Training: API Development with Node and Express',
                attendanceOpen: false,
                startTime: new Date('2026-02-18T19:00:00'),
                endTime: new Date('2026-02-18T20:00:00'),
                attendanceStartTime: new Date('2026-02-18T19:00:00'),
                attendanceEndTime: new Date('2026-02-18T19:15:00'),
                mode: 'ONLINE',
                assignments: [{ title: 'API Endpoint Code', type: 'text', description: 'Paste your GET/POST route code' }]
            },
            {
                dayId: day6._id,
                title: 'Assessment',
                description: 'Day 6 Training: MERN Stack verification',
                attendanceOpen: false,
                startTime: new Date('2026-02-18T20:00:00'),
                endTime: new Date('2026-02-18T21:00:00'),
                attendanceStartTime: new Date('2026-02-18T20:00:00'),
                attendanceEndTime: new Date('2026-02-18T20:15:00'),
                mode: 'ONLINE',
                assignments: [{ title: 'Day 6 Quiz', type: 'text', description: 'Complete the MERN evaluation' }]
            }
        ];

        for (const sessionData of sessionsForDay6) {
            await Session.create(sessionData);
            console.log(`  ✓ Created session: ${sessionData.title}`);
        }

        // Create sessions for Day 7
        const day7 = createdDays[6];
        const sessionsForDay7 = [
            {
                dayId: day7._id,
                title: 'Introduction to GEN AI, setting up the environment',
                description: 'Day 7 Training: Understanding LLMs and setups',
                attendanceOpen: false,
                startTime: new Date('2026-02-19T18:00:00'),
                endTime: new Date('2026-02-19T19:00:00'),
                attendanceStartTime: new Date('2026-02-19T18:00:00'),
                attendanceEndTime: new Date('2026-02-19T18:15:00'),
                mode: 'ONLINE',
                assignments: [{ title: 'Environment Config', type: 'text', description: 'List the libraries/tools installed' }]
            },
            {
                dayId: day7._id,
                title: 'RAG concepts and fundamentals',
                description: 'Day 7 Training: Retrieval-Augmented Generation',
                attendanceOpen: false,
                startTime: new Date('2026-02-19T19:00:00'),
                endTime: new Date('2026-02-19T20:00:00'),
                attendanceStartTime: new Date('2026-02-19T19:00:00'),
                attendanceEndTime: new Date('2026-02-19T19:15:00'),
                mode: 'ONLINE',
                assignments: [{ title: 'Vector DB choice', type: 'text', description: 'Explain why you chose a specific VectorDB' }]
            },
            {
                dayId: day7._id,
                title: 'Assessment',
                description: 'Day 7 Training: GEN AI Finale',
                attendanceOpen: false,
                startTime: new Date('2026-02-19T20:00:00'),
                endTime: new Date('2026-02-19T21:00:00'),
                attendanceStartTime: new Date('2026-02-19T20:00:00'),
                attendanceEndTime: new Date('2026-02-19T20:15:00'),
                mode: 'ONLINE',
                assignments: [{ title: 'Day 7 Quiz', type: 'text', description: 'Final GenAI evaluation' }]
            }
        ];

        for (const sessionData of sessionsForDay7) {
            await Session.create(sessionData);
            console.log(`  ✓ Created session: ${sessionData.title}`);
        }

        // Create sessions for Day 8
        const day8 = createdDays[7];
        const sessionsForDay8 = [
            {
                dayId: day8._id,
                title: 'Setup & First Workflow',
                description: 'Day 8 Training: Workflow Automation using n8n',
                attendanceOpen: false,
                startTime: new Date('2026-02-21T09:00:00'),
                endTime: new Date('2026-02-21T10:00:00'),
                attendanceStartTime: new Date('2026-02-21T09:00:00'),
                attendanceEndTime: new Date('2026-02-21T09:15:00'),
                mode: 'OFFLINE',
                assignments: [{ title: 'n8n Setup Proof', type: 'text', description: 'Paste the URL of your local n8n instance' }]
            },
            {
                dayId: day8._id,
                title: 'APIs, Webhooks & Second Workflow',
                description: 'Day 8 Training: Connecting external services',
                attendanceOpen: false,
                startTime: new Date('2026-02-21T10:00:00'),
                endTime: new Date('2026-02-21T11:00:00'),
                attendanceStartTime: new Date('2026-02-21T10:00:00'),
                attendanceEndTime: new Date('2026-02-21T10:15:00'),
                mode: 'OFFLINE',
                assignments: [{ title: 'Webhook Trigger Test', type: 'text', description: 'Describe your webhook logic' }]
            },
            {
                dayId: day8._id,
                title: 'Cloud Credentials & Final Workflow',
                description: 'Day 8 Training: Advanced integrations',
                attendanceOpen: false,
                startTime: new Date('2026-02-21T11:00:00'),
                endTime: new Date('2026-02-21T12:00:00'),
                attendanceStartTime: new Date('2026-02-21T11:00:00'),
                attendanceEndTime: new Date('2026-02-21T11:15:00'),
                mode: 'OFFLINE',
                assignments: [{ title: 'Final n8n Workflow Export', type: 'text', description: 'Paste the JSON export of your final workflow' }]
            },
            {
                dayId: day8._id,
                title: 'Customization, Debugging & Wrap-up',
                description: 'Day 8 Training: Troubleshooting and optimization',
                attendanceOpen: false,
                startTime: new Date('2026-02-21T12:00:00'),
                endTime: new Date('2026-02-21T13:00:00'),
                attendanceStartTime: new Date('2026-02-21T12:00:00'),
                attendanceEndTime: new Date('2026-02-21T12:15:00'),
                mode: 'OFFLINE',
                assignments: [{ title: 'Optimization Note', type: 'text', description: 'How did you improve your workflow?' }]
            },
            {
                dayId: day8._id,
                title: 'Lunch',
                description: 'Enjoy your lunch!',
                attendanceOpen: false,
                startTime: new Date('2026-02-21T13:00:00'),
                endTime: new Date('2026-02-21T14:00:00'),
                mode: 'OFFLINE',
                type: 'BREAK',
                assignments: [] // No assignments for lunch
            },
            {
                dayId: day8._id,
                title: 'Introduction and setup Windows subsystem for Linux',
                description: 'Day 8 Training: Linux Fundamentals & WSL',
                attendanceOpen: false,
                startTime: new Date('2026-02-21T14:00:00'),
                endTime: new Date('2026-02-21T15:00:00'),
                attendanceStartTime: new Date('2026-02-21T14:00:00'),
                attendanceEndTime: new Date('2026-02-21T14:15:00'),
                mode: 'OFFLINE',
                assignments: [{ title: 'WSL Version Proof', type: 'text', description: 'Paste output of wsl -l -v' }]
            },
            {
                dayId: day8._id,
                title: 'Linux Commands and package manager',
                description: 'Day 8 Training: Mastering the terminal',
                attendanceOpen: false,
                startTime: new Date('2026-02-21T15:00:00'),
                endTime: new Date('2026-02-21T16:00:00'),
                attendanceStartTime: new Date('2026-02-21T15:00:00'),
                attendanceEndTime: new Date('2026-02-21T15:15:00'),
                mode: 'OFFLINE',
                assignments: [{ title: 'Command Mastery list', type: 'text', description: 'List 5 useful linux commands you learned' }]
            },
            {
                dayId: day8._id,
                title: 'Linux foundations',
                description: 'Day 8 Training: Kernel, Shel and Process Management',
                attendanceOpen: false,
                startTime: new Date('2026-02-21T16:00:00'),
                endTime: new Date('2026-02-21T17:00:00'),
                attendanceStartTime: new Date('2026-02-21T16:00:00'),
                attendanceEndTime: new Date('2026-02-21T16:15:00'),
                mode: 'OFFLINE',
                assignments: [{ title: 'Foundations Quiz', type: 'text', description: 'Quick conceptual check' }]
            },
            {
                dayId: day8._id,
                title: 'Assessment',
                description: 'Day 8 Training: Final Workshop Evaluation',
                attendanceOpen: false,
                startTime: new Date('2026-02-21T17:00:00'),
                endTime: new Date('2026-02-21T18:00:00'),
                attendanceStartTime: new Date('2026-02-21T17:00:00'),
                attendanceEndTime: new Date('2026-02-21T17:15:00'),
                mode: 'OFFLINE',
                assignments: [{ title: 'Workshop Feedback', type: 'text', description: 'Share your key takeaways' }]
            }
        ];

        for (const sessionData of sessionsForDay8) {
            await Session.create(sessionData);
            console.log(`  ✓ Created session: ${sessionData.title}`);
        }

        console.log('\n✅ Database seeding completed successfully!');
        console.log('\n📋 Summary:');
        console.log(`   Students Created: ${studentsData.length}`);
        console.log(`   Days Created: ${createdDays.length}`);
        console.log(`   Login Rule: Password = Register Number`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

seedData();
