--
-- PostgreSQL database dump
--

\restrict l61L7whVBxOpCpyNE395Qqy06at0pgzJxTdcWLgFB4HOB9reK4pqBdLWTRPw6Q7

-- Dumped from database version 15.17
-- Dumped by pg_dump version 15.17

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: accommodation_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.accommodation_records (
    id text NOT NULL,
    "roomId" text NOT NULL,
    "guestName" text NOT NULL,
    "guestPhone" text NOT NULL,
    "guestIdCard" text,
    "accommodationType" text NOT NULL,
    "checkInDate" timestamp(3) without time zone NOT NULL,
    "checkOutDate" timestamp(3) without time zone,
    deposit double precision DEFAULT 0 NOT NULL,
    "totalFee" double precision DEFAULT 0 NOT NULL,
    status text DEFAULT 'CHECKED_IN'::text NOT NULL,
    operator text,
    remarks text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.accommodation_records OWNER TO postgres;

--
-- Name: devotees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.devotees (
    id text NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    wechat text,
    email text,
    "idCard" text,
    birthday timestamp(3) without time zone,
    zodiac text,
    address text,
    tags text[],
    level text DEFAULT 'NORMAL'::text NOT NULL,
    "totalDonation" double precision DEFAULT 0 NOT NULL,
    "firstVisitDate" timestamp(3) without time zone,
    "lastVisitDate" timestamp(3) without time zone,
    remarks text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.devotees OWNER TO postgres;

--
-- Name: dining_reservations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dining_reservations (
    id text NOT NULL,
    "mealType" text DEFAULT 'LUNCH'::text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "mealCount" integer DEFAULT 1 NOT NULL,
    "contactName" text NOT NULL,
    "contactPhone" text NOT NULL,
    amount double precision DEFAULT 0 NOT NULL,
    "paymentStatus" text DEFAULT 'UNPAID'::text NOT NULL,
    remarks text,
    operator text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.dining_reservations OWNER TO postgres;

--
-- Name: donations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.donations (
    id text NOT NULL,
    "devoteeId" text,
    "donorName" text NOT NULL,
    "donorPhone" text,
    type text NOT NULL,
    amount double precision NOT NULL,
    "paymentMethod" text,
    "donationDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "receiptNumber" text,
    operator text,
    remarks text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.donations OWNER TO postgres;

--
-- Name: hall_reservations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hall_reservations (
    id text NOT NULL,
    "hallId" text NOT NULL,
    "visitorName" text NOT NULL,
    "visitorPhone" text NOT NULL,
    "visitorCount" integer DEFAULT 1 NOT NULL,
    "reservationDate" timestamp(3) without time zone NOT NULL,
    "timeSlot" text,
    purpose text,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "checkIn" boolean DEFAULT false NOT NULL,
    operator text,
    remarks text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.hall_reservations OWNER TO postgres;

--
-- Name: halls; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.halls (
    id text NOT NULL,
    name text NOT NULL,
    location text,
    description text,
    capacity integer DEFAULT 0 NOT NULL,
    "openTime" text,
    status text DEFAULT 'OPEN'::text NOT NULL,
    images text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.halls OWNER TO postgres;

--
-- Name: lamp_offerings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lamp_offerings (
    id text NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    "lampType" text NOT NULL,
    location text,
    duration integer DEFAULT 7 NOT NULL,
    "blessingName" text,
    "blessingType" text,
    "blessingContent" text,
    amount double precision DEFAULT 0 NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.lamp_offerings OWNER TO postgres;

--
-- Name: memorial_plaques; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.memorial_plaques (
    id text NOT NULL,
    "plaqueType" text NOT NULL,
    "holderName" text,
    "deceasedName" text,
    "deceasedName2" text,
    "birthDate2" text,
    "deathDate2" text,
    zodiac2 text,
    gender2 text,
    gender text,
    zodiac text,
    "birthDate" text,
    "birthLunar" boolean DEFAULT false NOT NULL,
    "deathDate" text,
    "deathLunar" boolean DEFAULT false NOT NULL,
    "yangShang" text,
    phone text,
    address text,
    "dedicationType" text,
    "longevitySubtype" text,
    size text,
    "startDate" timestamp(3) without time zone,
    "endDate" timestamp(3) without time zone,
    "blessingText" text,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    remarks text,
    "templateId" text,
    "devoteeId" text,
    "ritualId" text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.memorial_plaques OWNER TO postgres;

--
-- Name: monks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.monks (
    id text NOT NULL,
    "dharmaName" text NOT NULL,
    name text,
    gender text,
    "birthDate" timestamp(3) without time zone,
    origin text,
    "ordinationDate" timestamp(3) without time zone,
    "ordinationType" text,
    rank integer DEFAULT 0 NOT NULL,
    "position" text,
    "hallId" text,
    phone text,
    "idCard" text,
    photo text,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    remarks text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.monks OWNER TO postgres;

--
-- Name: operation_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.operation_logs (
    id text NOT NULL,
    "userId" text,
    username text NOT NULL,
    action text NOT NULL,
    "targetType" text,
    "targetId" text,
    "beforeValue" jsonb,
    "afterValue" jsonb,
    ip text,
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.operation_logs OWNER TO postgres;

--
-- Name: plaque_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.plaque_templates (
    id text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    "backgroundImage" text,
    elements jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.plaque_templates OWNER TO postgres;

--
-- Name: registration_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.registration_requests (
    id text NOT NULL,
    "taskId" text NOT NULL,
    "taskType" text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "submitterName" text NOT NULL,
    "submitterPhone" text NOT NULL,
    "formData" jsonb NOT NULL,
    "rejectReason" text,
    "approvedById" text,
    "approvedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.registration_requests OWNER TO postgres;

--
-- Name: registration_tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.registration_tasks (
    id text NOT NULL,
    name text NOT NULL,
    "taskType" text NOT NULL,
    description text,
    enabled boolean DEFAULT false NOT NULL,
    "formConfig" jsonb,
    sort integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "wechatAccountId" text
);


ALTER TABLE public.registration_tasks OWNER TO postgres;

--
-- Name: ritual_participants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ritual_participants (
    id text NOT NULL,
    "ritualId" text NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    "checkedIn" boolean DEFAULT false NOT NULL,
    "checkInTime" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.ritual_participants OWNER TO postgres;

--
-- Name: rituals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rituals (
    id text NOT NULL,
    name text NOT NULL,
    "ritualType" text NOT NULL,
    description text,
    "ritualDate" timestamp(3) without time zone,
    "startTime" text,
    "endTime" text,
    location text,
    "maxParticipants" integer DEFAULT 0 NOT NULL,
    "currentParticipants" integer DEFAULT 0 NOT NULL,
    fee double precision DEFAULT 0 NOT NULL,
    "registrationDeadline" timestamp(3) without time zone,
    "allowOnlineRegistration" boolean DEFAULT true NOT NULL,
    status text DEFAULT 'DRAFT'::text NOT NULL,
    remarks text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.rituals OWNER TO postgres;

--
-- Name: rooms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rooms (
    id text NOT NULL,
    "roomNumber" text NOT NULL,
    type text DEFAULT 'SINGLE'::text NOT NULL,
    floor text,
    location text,
    capacity integer DEFAULT 1 NOT NULL,
    price double precision DEFAULT 0 NOT NULL,
    status text DEFAULT 'AVAILABLE'::text NOT NULL,
    facilities text DEFAULT ''::text NOT NULL,
    remarks text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.rooms OWNER TO postgres;

--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_settings (
    id text DEFAULT 'system'::text NOT NULL,
    "templeName" text DEFAULT '仙顶寺'::text NOT NULL,
    "templeAddress" text,
    "templePhone" text,
    "templeEmail" text,
    "templeLogo" text,
    "landingLogo" text,
    "landingBg" text,
    "wechatQrcode" text,
    "wechatAppId" text,
    "wechatAppSecret" text,
    "wechatToken" text,
    "wechatEncodingAESKey" text,
    "dedicationTypes" text DEFAULT '冤亲债主,堕胎婴灵,历代宗亲,无缘殊胜,生日超度,忌日超度,新建地基主,地基主'::text,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.system_settings OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id text NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    name text,
    email text,
    phone text,
    role text DEFAULT 'OPERATOR'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: visit_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.visit_records (
    id text NOT NULL,
    "visitorName" text NOT NULL,
    "visitorPhone" text NOT NULL,
    "visitorType" text DEFAULT 'DEVOTEE'::text NOT NULL,
    "groupName" text,
    "groupSize" integer DEFAULT 1 NOT NULL,
    "visitDate" timestamp(3) without time zone NOT NULL,
    "visitTime" text,
    "visitPurpose" text,
    "visitedPerson" text,
    remarks text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.visit_records OWNER TO postgres;

--
-- Name: volunteer_signups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.volunteer_signups (
    id text NOT NULL,
    "taskId" text NOT NULL,
    "volunteerId" text,
    "volunteerName" text NOT NULL,
    "volunteerPhone" text NOT NULL,
    status text DEFAULT 'SIGNED_UP'::text NOT NULL,
    "checkInTime" timestamp(3) without time zone,
    "checkOutTime" timestamp(3) without time zone,
    "serviceHours" double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.volunteer_signups OWNER TO postgres;

--
-- Name: volunteer_tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.volunteer_tasks (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "taskType" text NOT NULL,
    location text,
    "taskDate" timestamp(3) without time zone,
    "startTime" text,
    "endTime" text,
    "requiredCount" integer DEFAULT 1 NOT NULL,
    "currentCount" integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'RECRUITING'::text NOT NULL,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.volunteer_tasks OWNER TO postgres;

--
-- Name: volunteers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.volunteers (
    id text NOT NULL,
    name text NOT NULL,
    "dharmaName" text,
    gender text,
    "birthDate" timestamp(3) without time zone,
    photo text,
    ethnicity text,
    education text,
    phone text NOT NULL,
    address text,
    "emergencyContact" text,
    "emergencyPhone" text,
    "currentOccupation" text,
    "previousOccupation" text,
    "healthStatus" text,
    "hasInfectiousDisease" text,
    "diseaseHistory" text,
    "hasAllergy" text,
    "allergyHistory" text,
    "hasSpecialNeeds" text,
    "specialNeedsDetail" text,
    "firstContactBuddhism" text,
    "hasTakenRefuge" text,
    "refugeTime" timestamp(3) without time zone,
    "preceptsHeld" text[],
    "willingToLearn" text,
    "guidanceHope" text,
    "hasVolunteerExperience" text,
    "volunteerTimes" integer DEFAULT 0 NOT NULL,
    "lastVolunteerDate" timestamp(3) without time zone,
    "lastVolunteerLocation" text,
    "lastVolunteerContent" text,
    skills text[],
    "volunteerProjects" text[],
    "serviceStartDate" timestamp(3) without time zone,
    "serviceEndDate" timestamp(3) without time zone,
    "serviceDuration" text,
    commitment text,
    signature text,
    "totalHours" double precision DEFAULT 0 NOT NULL,
    rank text DEFAULT '一星'::text NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    remarks text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.volunteers OWNER TO postgres;

--
-- Name: warehouse_in; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.warehouse_in (
    id text NOT NULL,
    "itemId" text NOT NULL,
    quantity integer NOT NULL,
    price double precision,
    supplier text,
    operator text,
    "inDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    remarks text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.warehouse_in OWNER TO postgres;

--
-- Name: warehouse_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.warehouse_items (
    id text NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    unit text DEFAULT '个'::text NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    "minStock" integer DEFAULT 0 NOT NULL,
    price double precision DEFAULT 0 NOT NULL,
    location text,
    supplier text,
    remarks text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.warehouse_items OWNER TO postgres;

--
-- Name: warehouse_out; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.warehouse_out (
    id text NOT NULL,
    "itemId" text NOT NULL,
    quantity integer NOT NULL,
    purpose text,
    operator text,
    "outDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    remarks text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.warehouse_out OWNER TO postgres;

--
-- Name: wechat_accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wechat_accounts (
    id text NOT NULL,
    name text NOT NULL,
    "appId" text NOT NULL,
    "appSecret" text NOT NULL,
    token text,
    "encodingKey" text,
    type text DEFAULT 'SUB'::text NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.wechat_accounts OWNER TO postgres;

--
-- Data for Name: accommodation_records; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.accommodation_records (id, "roomId", "guestName", "guestPhone", "guestIdCard", "accommodationType", "checkInDate", "checkOutDate", deposit, "totalFee", status, operator, remarks, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: devotees; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.devotees (id, name, phone, wechat, email, "idCard", birthday, zodiac, address, tags, level, "totalDonation", "firstVisitDate", "lastVisitDate", remarks, "createdBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: dining_reservations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dining_reservations (id, "mealType", date, "mealCount", "contactName", "contactPhone", amount, "paymentStatus", remarks, operator, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: donations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.donations (id, "devoteeId", "donorName", "donorPhone", type, amount, "paymentMethod", "donationDate", "receiptNumber", operator, remarks, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: hall_reservations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hall_reservations (id, "hallId", "visitorName", "visitorPhone", "visitorCount", "reservationDate", "timeSlot", purpose, status, "checkIn", operator, remarks, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: halls; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.halls (id, name, location, description, capacity, "openTime", status, images, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: lamp_offerings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lamp_offerings (id, name, phone, "lampType", location, duration, "blessingName", "blessingType", "blessingContent", amount, "startDate", "endDate", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: memorial_plaques; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.memorial_plaques (id, "plaqueType", "holderName", "deceasedName", "deceasedName2", "birthDate2", "deathDate2", zodiac2, gender2, gender, zodiac, "birthDate", "birthLunar", "deathDate", "deathLunar", "yangShang", phone, address, "dedicationType", "longevitySubtype", size, "startDate", "endDate", "blessingText", status, remarks, "templateId", "devoteeId", "ritualId", "createdBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: monks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.monks (id, "dharmaName", name, gender, "birthDate", origin, "ordinationDate", "ordinationType", rank, "position", "hallId", phone, "idCard", photo, status, remarks, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: operation_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.operation_logs (id, "userId", username, action, "targetType", "targetId", "beforeValue", "afterValue", ip, "userAgent", "createdAt") FROM stdin;
cmo7rvcyf0002dns26zjh0uke	admin001	admin	CREATE	registration_task	cmo7rvcy50000dns2wh3uzf3b	\N	{"id": "cmo7rvcy50000dns2wh3uzf3b", "name": "牌位登记", "sort": 0, "enabled": true, "taskType": "REBIRTH", "createdAt": "2026-04-20T22:34:22.157Z", "updatedAt": "2026-04-20T22:34:22.157Z", "formConfig": ["deceasedName", "yangShang", "phone", "address", "deathDate", "startDate"], "description": "", "wechatAccountId": null}	\N	\N	2026-04-20 22:34:22.167
cmo7umycv0006dns255nlrek0	admin001	admin	APPROVE	registration_request	cmo7ryan00004dns2l1lppybq	\N	{"status": "APPROVED"}	\N	\N	2026-04-20 23:51:48.847
cmo833a48000bdns2m90uas47	admin001	admin	CREATE	plaque_template	cmo833a420009dns28tlczzmt	null	{"id": "cmo833a420009dns28tlczzmt", "name": "22222", "type": "ALL", "elements": [], "createdAt": "2026-04-21T03:48:27.505Z", "updatedAt": "2026-04-21T03:48:27.505Z", "backgroundImage": null}	\N	\N	2026-04-21 03:48:27.512
cmo834sg2000hdns2ed6szeri	admin001	admin	APPROVE	registration_request	cmo7w65ap0008dns2xmjltyr5	\N	{"status": "APPROVED"}	\N	\N	2026-04-21 03:49:37.923
cmo8dzi6c0001zg4jrjo2ja84	admin001	admin	DELETE	registration_request	cmo8barps000jdns2lj3lgaxi	\N	\N	\N	\N	2026-04-21 08:53:27.108
cmo8ic94d0003zg4j52sdaz6f	admin001	admin	DELETE	registration_request	cmo8bhc8n000ndns2vd5fx67b	\N	\N	\N	\N	2026-04-21 10:55:20.366
cmo9dyh7v0006zg4jb2axs2lv	admin001	admin	CREATE	devotee	cmo9dyh730004zg4j0ptu0psn	null	{"id": "cmo9dyh730004zg4j0ptu0psn", "name": "dddddd", "tags": ["义工"], "email": "", "level": "NORMAL", "phone": "", "idCard": "", "wechat": "", "zodiac": "", "address": "", "remarks": "", "birthday": null, "createdAt": "2026-04-22T01:40:25.352Z", "createdBy": "admin", "updatedAt": "2026-04-22T01:40:25.352Z", "lastVisitDate": null, "totalDonation": 0, "firstVisitDate": null}	\N	\N	2026-04-22 01:40:25.387
cmo9dyj8v0008zg4jmlpxxd4x	admin001	admin	DELETE	devotee	cmo9dyh730004zg4j0ptu0psn	\N	\N	\N	\N	2026-04-22 01:40:28.015
cmo9e1yp9000bzg4jtbk2if3b	admin001	admin	CREATE	plaque_template	cmo9e1yop0009zg4jrpa9h2et	null	{"id": "cmo9e1yop0009zg4jrpa9h2et", "name": "111", "type": "ALL", "elements": [], "createdAt": "2026-04-22T01:43:07.994Z", "updatedAt": "2026-04-22T01:43:07.994Z", "backgroundImage": null}	\N	\N	2026-04-22 01:43:08.013
cmo9f8jsn000ezg4jt2y7ovt3	admin001	admin	CREATE	plaque_template	cmo9f8jsh000czg4jr6s1s0w3	null	{"id": "cmo9f8jsh000czg4jr6s1s0w3", "name": "23", "type": "ALL", "elements": [], "createdAt": "2026-04-22T02:16:14.898Z", "updatedAt": "2026-04-22T02:16:14.898Z", "backgroundImage": null}	\N	\N	2026-04-22 02:16:14.903
\.


--
-- Data for Name: plaque_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.plaque_templates (id, name, type, "backgroundImage", elements, "createdAt", "updatedAt") FROM stdin;
cmo833a420009dns28tlczzmt	22222	ALL	\N	[]	2026-04-21 03:48:27.505	2026-04-21 03:48:27.505
cmo9e1yop0009zg4jrpa9h2et	111	ALL	\N	[]	2026-04-22 01:43:07.994	2026-04-22 01:43:07.994
cmo9f8jsh000czg4jr6s1s0w3	23	ALL	\N	[]	2026-04-22 02:16:14.898	2026-04-22 02:16:14.898
\.


--
-- Data for Name: registration_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.registration_requests (id, "taskId", "taskType", status, "submitterName", "submitterPhone", "formData", "rejectReason", "approvedById", "approvedAt", "createdAt", "updatedAt") FROM stdin;
cmo7w65ap0008dns2xmjltyr5	cmo7volunteer001	VOLUNTEER	APPROVED	张三	13800138000	{"name": "张三", "phone": "13800138000"}	\N	admin001	2026-04-21 03:49:37.915	2026-04-21 00:34:43.921	2026-04-21 03:49:37.916
cmo8bba7y000ldns2j1bcsz27	cmo7dining001	DINING	PENDING	张三	13800138000	{"mealType": "BREAKFAST", "mealCount": "2"}	\N	\N	\N	2026-04-21 07:38:37.822	2026-04-21 07:38:37.822
\.


--
-- Data for Name: registration_tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.registration_tasks (id, name, "taskType", description, enabled, "formConfig", sort, "createdAt", "updatedAt", "wechatAccountId") FROM stdin;
cmo7ritual001	法会报名	RITUAL	法会活动在线报名	t	["ritualId", "name", "phone"]	0	2026-04-20 23:18:31.046	2026-04-20 23:18:31.046	\N
cmo7blessing001	延生禄位	LONGEVITY	延生禄位在线登记	t	["holderName", "longevitySubtype", "size", "gender", "birthDate", "birthLunar", "phone", "address", "blessingText", "startDate", "serviceStartDate", "serviceEndDate"]	0	2026-04-20 23:18:30.542	2026-04-20 23:18:30.542	\N
cmo7rebirth001	往生莲位	REBIRTH	往生莲位在线登记	t	["deceasedName", "size", "gender", "birthDate", "birthLunar", "deathDate", "deathLunar", "yangShang", "phone", "address", "startDate", "deceasedName2", "birthDate2", "birthLunar2", "deathDate2", "deathLunar2"]	0	2026-04-20 23:18:30.661	2026-04-20 23:18:30.661	\N
cmo7dedication001	超度牌位	DELIVERANCE	超度牌位在线登记	t	["dedicationType", "customDedicationType", "deceasedName", "yangShang", "gender", "birthDate", "birthLunar", "phone", "address", "deathDate", "deathLunar", "startDate", "deceasedName2", "birthDate2", "birthLunar2", "deathDate2", "deathLunar2"]	0	2026-04-20 23:18:30.779	2026-04-20 23:18:30.779	\N
cmo7lamps001	供灯祈福	LAMP	供灯祈福在线登记	t	["lampType", "blessingName", "location", "serviceStartDate", "serviceEndDate"]	0	2026-04-20 23:18:30.926	2026-04-20 23:18:30.926	\N
cmo7volunteer001	义工报名	VOLUNTEER	仙顶寺义工招募登记	t	["name", "dharmaName", "gender", "birthDate", "phone", "emergencyContact", "address", "ethnicity", "education", "currentOccupation", "healthStatus", "hasInfectiousDisease", "hasAllergy", "hasSpecialNeeds", "firstContactBuddhism", "hasTakenRefuge", "refugeTime", "preceptsHeld", "willingToLearn", "guidanceHope", "hasVolunteerExperience", "volunteerTimes", "lastVolunteerDate", "lastVolunteerLocation", "lastVolunteerContent", "serviceStartDate", "serviceEndDate", "serviceDuration", "signature"]	0	2026-04-20 23:18:30.422	2026-04-20 23:18:30.422	\N
cmo7dining001	斋堂用餐	DINING	斋堂用餐登记	t	["mealType", "mealCount", "mealDate", "contactName", "contactPhone"]	0	2026-04-20 23:18:31.155	2026-04-20 23:18:31.155	\N
\.


--
-- Data for Name: ritual_participants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ritual_participants (id, "ritualId", name, phone, "checkedIn", "checkInTime", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: rituals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rituals (id, name, "ritualType", description, "ritualDate", "startTime", "endTime", location, "maxParticipants", "currentParticipants", fee, "registrationDeadline", "allowOnlineRegistration", status, remarks, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: rooms; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rooms (id, "roomNumber", type, floor, location, capacity, price, status, facilities, remarks, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_settings (id, "templeName", "templeAddress", "templePhone", "templeEmail", "templeLogo", "landingLogo", "landingBg", "wechatQrcode", "wechatAppId", "wechatAppSecret", "wechatToken", "wechatEncodingAESKey", "dedicationTypes", "updatedAt") FROM stdin;
system	仙顶寺	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	冤亲债主,堕胎婴灵,历代宗亲,无缘殊胜,生日超度,忌日超度,新建地基主,地基主	2026-04-20 23:51:51.947
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, password, name, email, phone, role, "createdAt", "updatedAt") FROM stdin;
admin001	admin	$2a$10$3WBKZ2SnXvDy5KpmVHszF.eHLu/wOPMMqlIfWSvnHkNEwk4Lopq/O	管理员	\N	\N	ADMIN	2026-04-20 22:32:54.102	2026-04-20 22:32:54.102
\.


--
-- Data for Name: visit_records; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.visit_records (id, "visitorName", "visitorPhone", "visitorType", "groupName", "groupSize", "visitDate", "visitTime", "visitPurpose", "visitedPerson", remarks, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: volunteer_signups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.volunteer_signups (id, "taskId", "volunteerId", "volunteerName", "volunteerPhone", status, "checkInTime", "checkOutTime", "serviceHours", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: volunteer_tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.volunteer_tasks (id, name, description, "taskType", location, "taskDate", "startTime", "endTime", "requiredCount", "currentCount", status, "createdBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: volunteers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.volunteers (id, name, "dharmaName", gender, "birthDate", photo, ethnicity, education, phone, address, "emergencyContact", "emergencyPhone", "currentOccupation", "previousOccupation", "healthStatus", "hasInfectiousDisease", "diseaseHistory", "hasAllergy", "allergyHistory", "hasSpecialNeeds", "specialNeedsDetail", "firstContactBuddhism", "hasTakenRefuge", "refugeTime", "preceptsHeld", "willingToLearn", "guidanceHope", "hasVolunteerExperience", "volunteerTimes", "lastVolunteerDate", "lastVolunteerLocation", "lastVolunteerContent", skills, "volunteerProjects", "serviceStartDate", "serviceEndDate", "serviceDuration", commitment, signature, "totalHours", rank, status, remarks, "createdAt", "updatedAt") FROM stdin;
cmo834sfq000fdns291j3grre	张三	\N	\N	\N	\N	\N	\N	13800138000	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	0	一星	ACTIVE	\N	2026-04-21 03:49:37.91	2026-04-21 03:49:37.91
\.


--
-- Data for Name: warehouse_in; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.warehouse_in (id, "itemId", quantity, price, supplier, operator, "inDate", remarks, "createdAt") FROM stdin;
\.


--
-- Data for Name: warehouse_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.warehouse_items (id, name, category, unit, stock, "minStock", price, location, supplier, remarks, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: warehouse_out; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.warehouse_out (id, "itemId", quantity, purpose, operator, "outDate", remarks, "createdAt") FROM stdin;
\.


--
-- Data for Name: wechat_accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wechat_accounts (id, name, "appId", "appSecret", token, "encodingKey", type, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Name: accommodation_records accommodation_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accommodation_records
    ADD CONSTRAINT accommodation_records_pkey PRIMARY KEY (id);


--
-- Name: devotees devotees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.devotees
    ADD CONSTRAINT devotees_pkey PRIMARY KEY (id);


--
-- Name: dining_reservations dining_reservations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dining_reservations
    ADD CONSTRAINT dining_reservations_pkey PRIMARY KEY (id);


--
-- Name: donations donations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_pkey PRIMARY KEY (id);


--
-- Name: hall_reservations hall_reservations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hall_reservations
    ADD CONSTRAINT hall_reservations_pkey PRIMARY KEY (id);


--
-- Name: halls halls_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.halls
    ADD CONSTRAINT halls_pkey PRIMARY KEY (id);


--
-- Name: lamp_offerings lamp_offerings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lamp_offerings
    ADD CONSTRAINT lamp_offerings_pkey PRIMARY KEY (id);


--
-- Name: memorial_plaques memorial_plaques_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.memorial_plaques
    ADD CONSTRAINT memorial_plaques_pkey PRIMARY KEY (id);


--
-- Name: monks monks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.monks
    ADD CONSTRAINT monks_pkey PRIMARY KEY (id);


--
-- Name: operation_logs operation_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operation_logs
    ADD CONSTRAINT operation_logs_pkey PRIMARY KEY (id);


--
-- Name: plaque_templates plaque_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plaque_templates
    ADD CONSTRAINT plaque_templates_pkey PRIMARY KEY (id);


--
-- Name: registration_requests registration_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registration_requests
    ADD CONSTRAINT registration_requests_pkey PRIMARY KEY (id);


--
-- Name: registration_tasks registration_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registration_tasks
    ADD CONSTRAINT registration_tasks_pkey PRIMARY KEY (id);


--
-- Name: ritual_participants ritual_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ritual_participants
    ADD CONSTRAINT ritual_participants_pkey PRIMARY KEY (id);


--
-- Name: rituals rituals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rituals
    ADD CONSTRAINT rituals_pkey PRIMARY KEY (id);


--
-- Name: rooms rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: visit_records visit_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_records
    ADD CONSTRAINT visit_records_pkey PRIMARY KEY (id);


--
-- Name: volunteer_signups volunteer_signups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.volunteer_signups
    ADD CONSTRAINT volunteer_signups_pkey PRIMARY KEY (id);


--
-- Name: volunteer_tasks volunteer_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.volunteer_tasks
    ADD CONSTRAINT volunteer_tasks_pkey PRIMARY KEY (id);


--
-- Name: volunteers volunteers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.volunteers
    ADD CONSTRAINT volunteers_pkey PRIMARY KEY (id);


--
-- Name: warehouse_in warehouse_in_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouse_in
    ADD CONSTRAINT warehouse_in_pkey PRIMARY KEY (id);


--
-- Name: warehouse_items warehouse_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouse_items
    ADD CONSTRAINT warehouse_items_pkey PRIMARY KEY (id);


--
-- Name: warehouse_out warehouse_out_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouse_out
    ADD CONSTRAINT warehouse_out_pkey PRIMARY KEY (id);


--
-- Name: wechat_accounts wechat_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wechat_accounts
    ADD CONSTRAINT wechat_accounts_pkey PRIMARY KEY (id);


--
-- Name: devotees_phone_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX devotees_phone_key ON public.devotees USING btree (phone);


--
-- Name: donations_donationDate_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "donations_donationDate_idx" ON public.donations USING btree ("donationDate");


--
-- Name: donations_donorName_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "donations_donorName_idx" ON public.donations USING btree ("donorName");


--
-- Name: donations_operator_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX donations_operator_idx ON public.donations USING btree (operator);


--
-- Name: donations_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX donations_type_idx ON public.donations USING btree (type);


--
-- Name: lamp_offerings_lampType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "lamp_offerings_lampType_idx" ON public.lamp_offerings USING btree ("lampType");


--
-- Name: lamp_offerings_startDate_endDate_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "lamp_offerings_startDate_endDate_idx" ON public.lamp_offerings USING btree ("startDate", "endDate");


--
-- Name: lamp_offerings_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX lamp_offerings_status_idx ON public.lamp_offerings USING btree (status);


--
-- Name: memorial_plaques_devoteeId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "memorial_plaques_devoteeId_idx" ON public.memorial_plaques USING btree ("devoteeId");


--
-- Name: memorial_plaques_plaqueType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "memorial_plaques_plaqueType_idx" ON public.memorial_plaques USING btree ("plaqueType");


--
-- Name: memorial_plaques_ritualId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "memorial_plaques_ritualId_idx" ON public.memorial_plaques USING btree ("ritualId");


--
-- Name: memorial_plaques_startDate_endDate_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "memorial_plaques_startDate_endDate_idx" ON public.memorial_plaques USING btree ("startDate", "endDate");


--
-- Name: memorial_plaques_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX memorial_plaques_status_idx ON public.memorial_plaques USING btree (status);


--
-- Name: memorial_plaques_yangShang_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "memorial_plaques_yangShang_idx" ON public.memorial_plaques USING btree ("yangShang");


--
-- Name: operation_logs_action_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX operation_logs_action_idx ON public.operation_logs USING btree (action);


--
-- Name: operation_logs_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "operation_logs_createdAt_idx" ON public.operation_logs USING btree ("createdAt");


--
-- Name: operation_logs_targetType_targetId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "operation_logs_targetType_targetId_idx" ON public.operation_logs USING btree ("targetType", "targetId");


--
-- Name: operation_logs_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "operation_logs_userId_idx" ON public.operation_logs USING btree ("userId");


--
-- Name: registration_requests_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "registration_requests_createdAt_idx" ON public.registration_requests USING btree ("createdAt");


--
-- Name: registration_requests_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX registration_requests_status_idx ON public.registration_requests USING btree (status);


--
-- Name: registration_requests_taskId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "registration_requests_taskId_idx" ON public.registration_requests USING btree ("taskId");


--
-- Name: registration_requests_taskType_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "registration_requests_taskType_status_idx" ON public.registration_requests USING btree ("taskType", status);


--
-- Name: rooms_roomNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "rooms_roomNumber_key" ON public.rooms USING btree ("roomNumber");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_username_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);


--
-- Name: volunteers_phone_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX volunteers_phone_idx ON public.volunteers USING btree (phone);


--
-- Name: volunteers_phone_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX volunteers_phone_key ON public.volunteers USING btree (phone);


--
-- Name: volunteers_rank_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX volunteers_rank_idx ON public.volunteers USING btree (rank);


--
-- Name: volunteers_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX volunteers_status_idx ON public.volunteers USING btree (status);


--
-- Name: wechat_accounts_appId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "wechat_accounts_appId_key" ON public.wechat_accounts USING btree ("appId");


--
-- Name: accommodation_records accommodation_records_roomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accommodation_records
    ADD CONSTRAINT "accommodation_records_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES public.rooms(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: donations donations_devoteeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT "donations_devoteeId_fkey" FOREIGN KEY ("devoteeId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: hall_reservations hall_reservations_hallId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hall_reservations
    ADD CONSTRAINT "hall_reservations_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES public.halls(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: memorial_plaques memorial_plaques_devoteeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.memorial_plaques
    ADD CONSTRAINT "memorial_plaques_devoteeId_fkey" FOREIGN KEY ("devoteeId") REFERENCES public.devotees(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: memorial_plaques memorial_plaques_ritualId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.memorial_plaques
    ADD CONSTRAINT "memorial_plaques_ritualId_fkey" FOREIGN KEY ("ritualId") REFERENCES public.rituals(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: memorial_plaques memorial_plaques_templateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.memorial_plaques
    ADD CONSTRAINT "memorial_plaques_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES public.plaque_templates(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: operation_logs operation_logs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operation_logs
    ADD CONSTRAINT "operation_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: registration_requests registration_requests_approvedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registration_requests
    ADD CONSTRAINT "registration_requests_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: registration_requests registration_requests_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registration_requests
    ADD CONSTRAINT "registration_requests_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.registration_tasks(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: registration_tasks registration_tasks_wechatAccountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registration_tasks
    ADD CONSTRAINT "registration_tasks_wechatAccountId_fkey" FOREIGN KEY ("wechatAccountId") REFERENCES public.wechat_accounts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ritual_participants ritual_participants_ritualId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ritual_participants
    ADD CONSTRAINT "ritual_participants_ritualId_fkey" FOREIGN KEY ("ritualId") REFERENCES public.rituals(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: volunteer_signups volunteer_signups_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.volunteer_signups
    ADD CONSTRAINT "volunteer_signups_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.volunteer_tasks(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: volunteer_signups volunteer_signups_volunteerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.volunteer_signups
    ADD CONSTRAINT "volunteer_signups_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES public.volunteers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: warehouse_in warehouse_in_itemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouse_in
    ADD CONSTRAINT "warehouse_in_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES public.warehouse_items(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: warehouse_out warehouse_out_itemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouse_out
    ADD CONSTRAINT "warehouse_out_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES public.warehouse_items(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict l61L7whVBxOpCpyNE395Qqy06at0pgzJxTdcWLgFB4HOB9reK4pqBdLWTRPw6Q7

