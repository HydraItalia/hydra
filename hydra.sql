--
-- PostgreSQL database dump
--

-- Dumped from database version 17.7 (bdc8956)
-- Dumped by pg_dump version 17.5 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: neondb_owner
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO neondb_owner;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: neondb_owner
--

COMMENT ON SCHEMA public IS '';


--
-- Name: CartStatus; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."CartStatus" AS ENUM (
    'ACTIVE',
    'ORDERED'
);


ALTER TYPE public."CartStatus" OWNER TO neondb_owner;

--
-- Name: CategoryGroupType; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."CategoryGroupType" AS ENUM (
    'FOOD',
    'BEVERAGE',
    'SERVICES'
);


ALTER TYPE public."CategoryGroupType" OWNER TO neondb_owner;

--
-- Name: DeliveryStatus; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."DeliveryStatus" AS ENUM (
    'ASSIGNED',
    'PICKED_UP',
    'IN_TRANSIT',
    'DELIVERED',
    'EXCEPTION'
);


ALTER TYPE public."DeliveryStatus" OWNER TO neondb_owner;

--
-- Name: DriverStatus; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."DriverStatus" AS ENUM (
    'ONLINE',
    'OFFLINE',
    'BUSY'
);


ALTER TYPE public."DriverStatus" OWNER TO neondb_owner;

--
-- Name: DriverStopStatus; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."DriverStopStatus" AS ENUM (
    'PENDING',
    'COMPLETED',
    'SKIPPED'
);


ALTER TYPE public."DriverStopStatus" OWNER TO neondb_owner;

--
-- Name: FuelLevel; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."FuelLevel" AS ENUM (
    'EMPTY',
    'QUARTER',
    'HALF',
    'THREE_QUARTERS',
    'FULL'
);


ALTER TYPE public."FuelLevel" OWNER TO neondb_owner;

--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'DRAFT',
    'SUBMITTED',
    'CONFIRMED',
    'FULFILLING',
    'DELIVERED',
    'CANCELED'
);


ALTER TYPE public."OrderStatus" OWNER TO neondb_owner;

--
-- Name: PriceMode; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."PriceMode" AS ENUM (
    'BASE',
    'DISCOUNT',
    'OVERRIDE'
);


ALTER TYPE public."PriceMode" OWNER TO neondb_owner;

--
-- Name: ProductUnit; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."ProductUnit" AS ENUM (
    'KG',
    'L',
    'PIECE',
    'BOX',
    'SERVICE'
);


ALTER TYPE public."ProductUnit" OWNER TO neondb_owner;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."Role" AS ENUM (
    'ADMIN',
    'AGENT',
    'VENDOR',
    'CLIENT',
    'DRIVER'
);


ALTER TYPE public."Role" OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Account; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Account" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    provider text NOT NULL,
    "providerAccountId" text NOT NULL,
    refresh_token text,
    access_token text,
    expires_at integer,
    token_type text,
    scope text,
    id_token text,
    session_state text
);


ALTER TABLE public."Account" OWNER TO neondb_owner;

--
-- Name: AgentClient; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."AgentClient" (
    "userId" text NOT NULL,
    "clientId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AgentClient" OWNER TO neondb_owner;

--
-- Name: AgentVendor; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."AgentVendor" (
    "userId" text NOT NULL,
    "vendorId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AgentVendor" OWNER TO neondb_owner;

--
-- Name: Agreement; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Agreement" (
    id text NOT NULL,
    "clientId" text NOT NULL,
    "vendorId" text NOT NULL,
    "priceMode" public."PriceMode" DEFAULT 'BASE'::public."PriceMode" NOT NULL,
    "discountPct" double precision,
    "overridePriceCents" integer,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."Agreement" OWNER TO neondb_owner;

--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."AuditLog" (
    id text NOT NULL,
    "actorUserId" text,
    "entityType" text NOT NULL,
    "entityId" text NOT NULL,
    action text NOT NULL,
    diff jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AuditLog" OWNER TO neondb_owner;

--
-- Name: Cart; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Cart" (
    id text NOT NULL,
    "clientId" text NOT NULL,
    "createdByUserId" text NOT NULL,
    status public."CartStatus" DEFAULT 'ACTIVE'::public."CartStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Cart" OWNER TO neondb_owner;

--
-- Name: CartItem; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."CartItem" (
    id text NOT NULL,
    "cartId" text NOT NULL,
    "vendorProductId" text NOT NULL,
    qty integer NOT NULL,
    "unitPriceCents" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CartItem" OWNER TO neondb_owner;

--
-- Name: CategoryGroup; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."CategoryGroup" (
    id text NOT NULL,
    name public."CategoryGroupType" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CategoryGroup" OWNER TO neondb_owner;

--
-- Name: Client; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Client" (
    id text NOT NULL,
    name text NOT NULL,
    region text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "fullAddress" text,
    "shortAddress" text
);


ALTER TABLE public."Client" OWNER TO neondb_owner;

--
-- Name: Delivery; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Delivery" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "driverId" text NOT NULL,
    status public."DeliveryStatus" DEFAULT 'ASSIGNED'::public."DeliveryStatus" NOT NULL,
    notes text,
    "exceptionReason" text,
    "assignedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "pickedUpAt" timestamp(3) without time zone,
    "inTransitAt" timestamp(3) without time zone,
    "deliveredAt" timestamp(3) without time zone,
    "exceptionAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "routeSequence" integer
);


ALTER TABLE public."Delivery" OWNER TO neondb_owner;

--
-- Name: Driver; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Driver" (
    id text NOT NULL,
    name text NOT NULL,
    phone text,
    status public."DriverStatus" DEFAULT 'OFFLINE'::public."DriverStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."Driver" OWNER TO neondb_owner;

--
-- Name: DriverShift; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."DriverShift" (
    id text NOT NULL,
    "driverId" text NOT NULL,
    "vehicleId" text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "startKm" integer NOT NULL,
    "startFuelLevel" public."FuelLevel" NOT NULL,
    "startTime" timestamp(3) without time zone NOT NULL,
    "endKm" integer,
    "endFuelLevel" public."FuelLevel",
    "endTime" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "cashReturnedConfirmed" boolean DEFAULT false,
    "closingNotes" text
);


ALTER TABLE public."DriverShift" OWNER TO neondb_owner;

--
-- Name: DriverStop; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."DriverStop" (
    id text NOT NULL,
    "shiftId" text NOT NULL,
    "clientId" text NOT NULL,
    "sequenceNumber" integer NOT NULL,
    status public."DriverStopStatus" DEFAULT 'PENDING'::public."DriverStopStatus" NOT NULL,
    "cashCollectedCents" integer,
    "bonCollectedCents" integer,
    "startedAt" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."DriverStop" OWNER TO neondb_owner;

--
-- Name: Order; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Order" (
    id text NOT NULL,
    "clientId" text NOT NULL,
    "submitterUserId" text NOT NULL,
    status public."OrderStatus" DEFAULT 'DRAFT'::public."OrderStatus" NOT NULL,
    region text,
    "assignedAgentUserId" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "orderNumber" text NOT NULL,
    "deliveryAddress" text,
    "deliveryLat" double precision,
    "deliveryLng" double precision,
    "totalCents" integer NOT NULL
);


ALTER TABLE public."Order" OWNER TO neondb_owner;

--
-- Name: OrderItem; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."OrderItem" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "vendorProductId" text NOT NULL,
    qty integer NOT NULL,
    "unitPriceCents" integer NOT NULL,
    "lineTotalCents" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "productName" text NOT NULL,
    "vendorName" text NOT NULL
);


ALTER TABLE public."OrderItem" OWNER TO neondb_owner;

--
-- Name: Product; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Product" (
    id text NOT NULL,
    "categoryId" text NOT NULL,
    name text NOT NULL,
    description text,
    unit public."ProductUnit" DEFAULT 'PIECE'::public."ProductUnit" NOT NULL,
    "imageUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."Product" OWNER TO neondb_owner;

--
-- Name: ProductCategory; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."ProductCategory" (
    id text NOT NULL,
    "groupId" text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ProductCategory" OWNER TO neondb_owner;

--
-- Name: Session; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Session" (
    id text NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Session" OWNER TO neondb_owner;

--
-- Name: User; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    name text,
    role public."Role" DEFAULT 'CLIENT'::public."Role" NOT NULL,
    "agentCode" text,
    "vendorId" text,
    "clientId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "emailVerified" timestamp(3) without time zone,
    "driverId" text
);


ALTER TABLE public."User" OWNER TO neondb_owner;

--
-- Name: Vehicle; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Vehicle" (
    id text NOT NULL,
    "licensePlate" text NOT NULL,
    description text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Vehicle" OWNER TO neondb_owner;

--
-- Name: Vendor; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Vendor" (
    id text NOT NULL,
    name text NOT NULL,
    region text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    address text,
    "businessHours" text,
    "contactEmail" text,
    "contactPhone" text,
    "defaultOrderNotes" text
);


ALTER TABLE public."Vendor" OWNER TO neondb_owner;

--
-- Name: VendorProduct; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."VendorProduct" (
    id text NOT NULL,
    "vendorId" text NOT NULL,
    "productId" text NOT NULL,
    "vendorSku" text NOT NULL,
    "basePriceCents" integer NOT NULL,
    currency text DEFAULT 'EUR'::text NOT NULL,
    "stockQty" integer DEFAULT 0 NOT NULL,
    "leadTimeDays" integer DEFAULT 0 NOT NULL,
    "minOrderQty" integer,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."VendorProduct" OWNER TO neondb_owner;

--
-- Name: VerificationToken; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."VerificationToken" (
    identifier text NOT NULL,
    token text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."VerificationToken" OWNER TO neondb_owner;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO neondb_owner;

--
-- Name: playing_with_neon; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.playing_with_neon (
    id integer NOT NULL,
    name text NOT NULL,
    value real
);


ALTER TABLE public.playing_with_neon OWNER TO neondb_owner;

--
-- Name: playing_with_neon_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.playing_with_neon_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.playing_with_neon_id_seq OWNER TO neondb_owner;

--
-- Name: playing_with_neon_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.playing_with_neon_id_seq OWNED BY public.playing_with_neon.id;


--
-- Name: playing_with_neon id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.playing_with_neon ALTER COLUMN id SET DEFAULT nextval('public.playing_with_neon_id_seq'::regclass);


--
-- Data for Name: Account; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Account" (id, "userId", type, provider, "providerAccountId", refresh_token, access_token, expires_at, token_type, scope, id_token, session_state) FROM stdin;
\.


--
-- Data for Name: AgentClient; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AgentClient" ("userId", "clientId", "createdAt") FROM stdin;
gzp5yxsh247c68cprtg12bs2	tluf5puru5n29pz5r3phzb3n	2025-11-25 15:11:26.964
\.


--
-- Data for Name: AgentVendor; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AgentVendor" ("userId", "vendorId", "createdAt") FROM stdin;
gzp5yxsh247c68cprtg12bs2	v7ke5gm3d70tn157b0vvxlvg	2025-11-25 15:11:26.75
gzp5yxsh247c68cprtg12bs2	ymkw92mnbxxlwruo6rr2yyc1	2025-11-25 15:11:26.894
kl3pg8h8w1wbz8buwi5t960w	nrvc77uqaawbor31e1bx4c9a	2025-11-25 15:11:27.109
kl3pg8h8w1wbz8buwi5t960w	yhoxsn248ihovbv0i7flt0le	2025-11-25 15:11:27.179
\.


--
-- Data for Name: Agreement; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Agreement" (id, "clientId", "vendorId", "priceMode", "discountPct", "overridePriceCents", notes, "createdAt", "updatedAt", "deletedAt") FROM stdin;
k20leoq1281o6u5vyem88qhw	tluf5puru5n29pz5r3phzb3n	v7ke5gm3d70tn157b0vvxlvg	DISCOUNT	0.05	\N	Preferred beverage supplier - volume discount	2025-11-25 15:11:26.529	2025-11-25 15:11:26.529	\N
iwknlxfxxpv1iw1poemx1do0	tluf5puru5n29pz5r3phzb3n	ymkw92mnbxxlwruo6rr2yyc1	DISCOUNT	0.1	\N	Fresh seafood supplier - regular customer discount	2025-11-25 15:11:26.678	2025-11-25 15:11:26.678	\N
\.


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AuditLog" (id, "actorUserId", "entityType", "entityId", action, diff, "createdAt") FROM stdin;
\.


--
-- Data for Name: Cart; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Cart" (id, "clientId", "createdByUserId", status, "createdAt", "updatedAt") FROM stdin;
uf0r1oil2swdulqzofc9mf4g	tluf5puru5n29pz5r3phzb3n	p0l66j6cy39cg7qimylxvf1d	ACTIVE	2025-11-25 15:13:57.972	2025-11-25 15:13:57.972
\.


--
-- Data for Name: CartItem; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."CartItem" (id, "cartId", "vendorProductId", qty, "unitPriceCents", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: CategoryGroup; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."CategoryGroup" (id, name, "createdAt", "updatedAt") FROM stdin;
m7vzcakc9srqq9nxu4x69qb7	FOOD	2025-11-25 14:52:54.366	2025-11-25 14:52:54.366
y9r7aam3d306uwo51tut0m0a	BEVERAGE	2025-11-25 14:54:07.482	2025-11-25 14:54:07.482
r5sm13yybx2flbxjue3he9v3	SERVICES	2025-11-25 15:11:09.643	2025-11-25 15:11:09.643
\.


--
-- Data for Name: Client; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Client" (id, name, region, notes, "createdAt", "updatedAt", "deletedAt", "fullAddress", "shortAddress") FROM stdin;
tluf5puru5n29pz5r3phzb3n	Demo Ristorante	Lazio	Demo restaurant for testing	2025-11-25 15:11:25.91	2025-11-25 15:11:25.91	\N	Piazza Navona 45, 00186 Roma RM, Italy	Piazza Navona, Roma
xkjrtu238wgbwbhvt8x3b6uu	Trattoria Trastevere	Lazio	Traditional Roman cuisine	2025-11-25 15:11:26.09	2025-11-25 15:11:26.09	\N	Piazza di Santa Maria in Trastevere 8, 00153 Roma RM, Italy	Trastevere, Roma
jhrsepgjp9d3kedmkrwnb3lf	Osteria Campo de' Fiori	Lazio	Wine bar and restaurant	2025-11-25 15:11:26.162	2025-11-25 15:11:26.162	\N	Campo de' Fiori 22, 00186 Roma RM, Italy	Campo de' Fiori, Roma
edexsni7wxpkkcoekyml290p	Ristorante Testaccio	Lazio	Modern Italian cuisine	2025-11-25 15:11:26.233	2025-11-25 15:11:26.233	\N	Via Marmorata 39, 00153 Roma RM, Italy	Testaccio, Roma
vanr9zb4a64my7fh14ai05sb	Bar Pantheon	Lazio	Coffee bar near Pantheon	2025-11-25 15:11:26.306	2025-11-25 15:11:26.306	\N	Piazza della Rotonda 63, 00186 Roma RM, Italy	Pantheon, Roma
\.


--
-- Data for Name: Delivery; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Delivery" (id, "orderId", "driverId", status, notes, "exceptionReason", "assignedAt", "pickedUpAt", "inTransitAt", "deliveredAt", "exceptionAt", "createdAt", "updatedAt", "routeSequence") FROM stdin;
de88uvsdhqfhxxzh02tlr1pq	ht6jcbvpflkm8ea225ebqdqf	mvhj4q6p47zjngtmhr5njle7	ASSIGNED	Assigned to Marco - ready for pickup	\N	2025-11-25 15:11:29.286	\N	\N	\N	\N	2025-11-25 15:11:29.286	2025-11-25 15:11:29.286	\N
le06yqlpyqrvkgopikavxpwh	idcleu14vrvp31i2cpgoxmk7	n0ylz0bgkele6k8bj98w9w73	IN_TRANSIT	On the way to Testaccio	\N	2025-11-25 15:11:29.882	2025-11-25 13:41:29.881	2025-11-25 14:11:29.881	\N	\N	2025-11-25 15:11:29.882	2025-11-25 15:11:29.882	\N
ybez0xq9qpqfd9ru9y34trp4	tt9yp7thnv2mtbrcpkizfhdo	mvhj4q6p47zjngtmhr5njle7	EXCEPTION	Picked up from CD Fish warehouse	Ok	2025-11-25 15:11:29.586	2025-11-25 14:41:29.581	2025-11-26 10:51:55.973	\N	2025-12-07 14:20:21.395	2025-11-25 15:11:29.586	2025-12-07 14:20:21.396	\N
\.


--
-- Data for Name: Driver; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Driver" (id, name, phone, status, "createdAt", "updatedAt", "deletedAt") FROM stdin;
mvhj4q6p47zjngtmhr5njle7	Marco Rossi	+39 333 1234567	ONLINE	2025-11-25 15:11:28.481	2025-11-25 15:11:28.481	\N
n0ylz0bgkele6k8bj98w9w73	Giulia Bianchi	+39 334 7654321	OFFLINE	2025-11-25 15:11:28.628	2025-11-25 15:11:28.628	\N
\.


--
-- Data for Name: DriverShift; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."DriverShift" (id, "driverId", "vehicleId", date, "startKm", "startFuelLevel", "startTime", "endKm", "endFuelLevel", "endTime", "createdAt", "updatedAt", "cashReturnedConfirmed", "closingNotes") FROM stdin;
g69c9r1ojwve073g4lkj4xuj	mvhj4q6p47zjngtmhr5njle7	cmieprfkl00008bac3fdlg1d5	2025-11-25 06:30:00	45230	THREE_QUARTERS	2025-11-25 06:30:00	\N	\N	\N	2025-11-25 15:11:30.17	2025-11-25 15:11:30.17	f	\N
cmifvydfk0001wrxlpszped6x	mvhj4q6p47zjngtmhr5njle7	cmieprfkl00008bac3fdlg1d5	2025-11-25 23:00:00	12345	THREE_QUARTERS	2025-11-26 10:52:36.605	\N	\N	\N	2025-11-26 10:52:36.607	2025-11-26 10:52:36.607	f	\N
cmj3nq30y0001k8yj3qi037tq	mvhj4q6p47zjngtmhr5njle7	cmieprfkl00008bac3fdlg1d5	2025-12-13 00:00:00	54000	THREE_QUARTERS	2025-12-13 02:08:41.168	\N	\N	\N	2025-12-13 02:08:41.169	2025-12-13 02:08:41.169	f	\N
cmj6l2oda0001jyl3xj9nci2c	mvhj4q6p47zjngtmhr5njle7	cmieprfkl00008bac3fdlg1d5	2025-12-15 00:00:00	2424	THREE_QUARTERS	2025-12-15 03:17:48.38	\N	\N	\N	2025-12-15 03:17:48.381	2025-12-15 03:17:48.381	f	\N
\.


--
-- Data for Name: DriverStop; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."DriverStop" (id, "shiftId", "clientId", "sequenceNumber", status, "cashCollectedCents", "bonCollectedCents", "startedAt", "completedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Order; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Order" (id, "clientId", "submitterUserId", status, region, "assignedAgentUserId", notes, "createdAt", "updatedAt", "deletedAt", "orderNumber", "deliveryAddress", "deliveryLat", "deliveryLng", "totalCents") FROM stdin;
yokwd63r8qawydo2fu2ulvvk	tluf5puru5n29pz5r3phzb3n	p0l66j6cy39cg7qimylxvf1d	SUBMITTED	Lazio	gzp5yxsh247c68cprtg12bs2	Weekly order for restaurant supplies	2025-11-25 15:11:28.111	2025-11-25 15:11:28.111	\N	HYD-20241121-0001	Piazza Navona, 00186 Roma RM, Italy	41.8992	12.4731	7502
ht6jcbvpflkm8ea225ebqdqf	xkjrtu238wgbwbhvt8x3b6uu	p0l66j6cy39cg7qimylxvf1d	CONFIRMED	Lazio	kl3pg8h8w1wbz8buwi5t960w	Beverage order for weekend	2025-11-25 15:11:29.136	2025-11-25 15:11:29.136	\N	HYD-20241121-0002	Piazza di Santa Maria in Trastevere, 00153 Roma RM, Italy	41.8894	12.4692	7720
tt9yp7thnv2mtbrcpkizfhdo	jhrsepgjp9d3kedmkrwnb3lf	p0l66j6cy39cg7qimylxvf1d	FULFILLING	Lazio	gzp5yxsh247c68cprtg12bs2	Fresh seafood delivery	2025-11-25 15:11:29.436	2025-11-25 15:11:29.436	\N	HYD-20241121-0003	Campo de' Fiori 22, 00186 Roma RM, Italy	41.8955	12.4723	7500
idcleu14vrvp31i2cpgoxmk7	edexsni7wxpkkcoekyml290p	p0l66j6cy39cg7qimylxvf1d	FULFILLING	Lazio	gzp5yxsh247c68cprtg12bs2	Beverage restock	2025-11-25 15:11:29.735	2025-11-25 15:11:29.735	\N	HYD-20241121-0004	Via Marmorata 39, 00153 Roma RM, Italy	41.8769	12.4759	12520
jdiodb9pmsjy33fs2kj978gg	tluf5puru5n29pz5r3phzb3n	p0l66j6cy39cg7qimylxvf1d	SUBMITTED	\N	\N	\N	2025-11-26 10:40:55.602	2025-11-26 10:40:55.602	\N	HYD-20251126-3513	\N	\N	\N	101250
nohd32chh0mhcof7m572ad26	tluf5puru5n29pz5r3phzb3n	p0l66j6cy39cg7qimylxvf1d	SUBMITTED	\N	\N	\N	2025-12-01 20:08:32.191	2025-12-01 20:08:32.191	\N	HYD-20251201-9281	\N	\N	\N	3384
zlvc9cgkq6avyhtg6y89evxr	tluf5puru5n29pz5r3phzb3n	p0l66j6cy39cg7qimylxvf1d	SUBMITTED	\N	\N	\N	2025-12-01 21:04:11.888	2025-12-01 21:04:11.888	\N	HYD-20251201-1036	\N	\N	\N	24570
x99qk325mvth146hwb20c2bf	tluf5puru5n29pz5r3phzb3n	p0l66j6cy39cg7qimylxvf1d	SUBMITTED	\N	\N	\N	2025-12-08 23:58:23.935	2025-12-08 23:58:23.935	\N	HYD-20251208-2636	\N	\N	\N	3060
int22qvb10gly4ikrw66k461	tluf5puru5n29pz5r3phzb3n	p0l66j6cy39cg7qimylxvf1d	SUBMITTED	\N	\N	\N	2025-12-11 18:18:19.641	2025-12-11 18:18:19.641	\N	HYD-20251211-2209	\N	\N	\N	19443
uveji5kokqxblw133msg00aa	tluf5puru5n29pz5r3phzb3n	p0l66j6cy39cg7qimylxvf1d	SUBMITTED	\N	\N	\N	2025-12-13 00:31:58.826	2025-12-13 00:31:58.826	\N	HYD-20251213-8183	\N	\N	\N	2448
qjmxmguxp5dil0vlqw4wp9gb	tluf5puru5n29pz5r3phzb3n	p0l66j6cy39cg7qimylxvf1d	SUBMITTED	\N	\N	\N	2025-12-15 03:15:21.441	2025-12-15 03:15:21.441	\N	HYD-20251215-2086	\N	\N	\N	4896
\.


--
-- Data for Name: OrderItem; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."OrderItem" (id, "orderId", "vendorProductId", qty, "unitPriceCents", "lineTotalCents", "createdAt", "updatedAt", "productName", "vendorName") FROM stdin;
ord646c2kazfz3t5xt7jda8k	yokwd63r8qawydo2fu2ulvvk	e4x9zwe8e2cpgpy575ew3acq	5	1492	7460	2025-11-25 15:11:28.261	2025-11-25 15:11:28.261	0,700 lt  DLD002	White Dog S.r.l.
xw3l96i2ljyyl9sxu4krq7tr	yokwd63r8qawydo2fu2ulvvk	a54v6ek5eutx85wadu1a85k8	3	14	42	2025-11-25 15:11:28.409	2025-11-25 15:11:28.409	433 Spiedini	CD Fish S.r.l.
bg0m4daoko0rasxhm86qvfw6	ht6jcbvpflkm8ea225ebqdqf	a0gzbv8mtwklw1fnzawmikdd	10	772	7720	2025-11-25 15:11:29.21	2025-11-25 15:11:29.21	12540 VINO PINOT GRIGIO  "ZORZETTIG" CL. 75X6 0,75 CRT 6 46,33	General Beverage Distributor
fs6yejfpzogo78ovtt4xok3k	tt9yp7thnv2mtbrcpkizfhdo	a9n3eqop8s8xby74bks9kwu1	5	1500	7500	2025-11-25 15:11:29.507	2025-11-25 15:11:29.507	526 Polpo Verace Spagna Cong.	CD Fish S.r.l.
kzgcgleozw7dqvi8enpowiwy	idcleu14vrvp31i2cpgoxmk7	evsirkwobo5ehjpjl4ejkbwx	8	1565	12520	2025-11-25 15:11:29.809	2025-11-25 15:11:29.809	1 lt DLL001	White Dog S.r.l.
m2hlv5utx6yo5vphrsleeyan	jdiodb9pmsjy33fs2kj978gg	mdvr4n762bfhuw5if9th65t4	75	1350	101250	2025-11-26 10:40:55.708	2025-11-26 10:40:55.708	528 Polpo T5 iqf	CD Fish S.r.l.
barkxmttatoefmp9z94owfrc	nohd32chh0mhcof7m572ad26	kxrjmobrxk686lgvyac59ruz	2	1692	3384	2025-12-01 20:08:32.285	2025-12-01 20:08:32.285	376 Coda Rospo 1000/2000	CD Fish S.r.l.
tz5ikbl0q4h96r0uzxi07sr6	zlvc9cgkq6avyhtg6y89evxr	xwjcd4pbbrt5t75g867cr1pi	6	4095	24570	2025-12-01 21:04:11.996	2025-12-01 21:04:11.996	321 Scampi 6/10 Porcupine	CD Fish S.r.l.
o4m9twy73qelxkib0bwj8oby	x99qk325mvth146hwb20c2bf	ed495vbxsgo6cu6qag1utcub	5	612	3060	2025-12-08 23:58:24.13	2025-12-08 23:58:24.13	151 Mazzancolla 30/40	CD Fish S.r.l.
hs2ny47se4yn4qvx84k7kggt	int22qvb10gly4ikrw66k461	c9fabgxmycvp42cppntgpbvh	3	756	2268	2025-12-11 18:18:19.87	2025-12-11 18:18:19.87	238 Orata 3/4 A	CD Fish S.r.l.
ssec8olasammznmlwxtd4sf3	int22qvb10gly4ikrw66k461	jrc64ok3nej532hpeelov4oq	5	1463	7315	2025-12-11 18:18:19.87	2025-12-11 18:18:19.87	14257 VODKA ABSOLUT CL.70 0,70 BOT 1 14,63	General Beverage Distributor
ot1hfb9xnlvdsd66wa1tdslb	int22qvb10gly4ikrw66k461	jj0lsdi89zuv6jk95xbn4htz	2	4930	9860	2025-12-11 18:18:19.87	2025-12-11 18:18:19.87	12228 CHAMPAGNE MUMM CL75*1 0,75 BOT 1 49,30	General Beverage Distributor
ekr3oafe98j0eci5i7c7fkb0	uveji5kokqxblw133msg00aa	ed495vbxsgo6cu6qag1utcub	4	612	2448	2025-12-13 00:31:59.027	2025-12-13 00:31:59.027	151 Mazzancolla 30/40	CD Fish S.r.l.
hequ7fcbbh7ot8cjbhpj8nse	qjmxmguxp5dil0vlqw4wp9gb	ed495vbxsgo6cu6qag1utcub	8	612	4896	2025-12-15 03:15:21.64	2025-12-15 03:15:21.64	151 Mazzancolla 30/40	CD Fish S.r.l.
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Product" (id, "categoryId", name, description, unit, "imageUrl", "createdAt", "updatedAt", "deletedAt") FROM stdin;
ya758e49bjllygdno6zhkl0i	i3drl6jajs2ilp2nqwn2rlsl	532 Soas o 500/1000		PIECE	\N	2025-11-25 14:53:05.723	2025-11-25 14:53:05.723	\N
n9dwoxlu9zbmiivlsllyjww9	i3drl6jajs2ilp2nqwn2rlsl	531 Soaso 1000/2000		PIECE	\N	2025-11-25 14:53:06.367	2025-11-25 14:53:06.367	\N
kuho36elphowa0v28kxdi3fe	i3drl6jajs2ilp2nqwn2rlsl	049 Soaso 8 00/1200		PIECE	\N	2025-11-25 14:53:07	2025-11-25 14:53:07	\N
unmlsuzwvf2ztf43jtlshgjq	i3drl6jajs2ilp2nqwn2rlsl	050 Sogliole 03 intere		PIECE	\N	2025-11-25 14:53:07.64	2025-11-25 14:53:07.64	\N
ply7slfyynxe9v6z01rbekja	i3drl6jajs2ilp2nqwn2rlsl	517 Sogliole 03 eviscerate		PIECE	\N	2025-11-25 14:53:08.275	2025-11-25 14:53:08.275	\N
q840v00tn14wk4xqzusqu6y7	i3drl6jajs2ilp2nqwn2rlsl	400 Cuore Merluzzo  Anova		PIECE	\N	2025-11-25 14:53:08.908	2025-11-25 14:53:08.908	\N
xhvk0em9gkcfiwsbbqdj9i91	i3drl6jajs2ilp2nqwn2rlsl	400 Cuore Merluzzo Bertus		PIECE	\N	2025-11-25 14:53:09.543	2025-11-25 14:53:09.543	\N
m4hasdxj20lyjywmp21i7w0p	i3drl6jajs2ilp2nqwn2rlsl	683 Seppie Acq ua M x3kg		KG	\N	2025-11-25 14:53:10.182	2025-11-25 14:53:10.182	\N
wa6gq2idh0elbe59wb3vf9yk	i3drl6jajs2ilp2nqwn2rlsl	068 Seppia Acqua G x3kg		KG	\N	2025-11-25 14:53:10.819	2025-11-25 14:53:10.819	\N
zx9s0fi9e5kpq3ucjsedhtxa	i3drl6jajs2ilp2nqwn2rlsl	285 Strisce  Totano Acqua x6kg		KG	\N	2025-11-25 14:53:11.448	2025-11-25 14:53:11.448	\N
ihnle21wv1xy6ejmfja0jtp0	i3drl6jajs2ilp2nqwn2rlsl	100 Moscardini  Acqua (60up) x3kg		KG	\N	2025-11-25 14:53:12.082	2025-11-25 14:53:12.082	\N
e6ji79tl45m76827zrlgulco	i3drl6jajs2ilp2nqwn2rlsl	631 Tentacoli Acqua x6kg		KG	\N	2025-11-25 14:53:12.717	2025-11-25 14:53:12.717	\N
daxsfb394cnb12ikp1cvl5gx	i3drl6jajs2ilp2nqwn2rlsl	636 Anelli Acq ua x3kg		KG	\N	2025-11-25 14:53:13.349	2025-11-25 14:53:13.349	\N
l3thr0197t31fdhsvazbfn6o	i3drl6jajs2ilp2nqwn2rlsl	103 Anelli Acq ua x6kg		KG	\N	2025-11-25 14:53:13.986	2025-11-25 14:53:13.986	\N
yeootrgmlm1pzzh8wjrauvtv	i3drl6jajs2ilp2nqwn2rlsl	275 Totano Acqua Atlantico		PIECE	\N	2025-11-25 14:53:14.62	2025-11-25 14:53:14.62	\N
qmjyu5fbmlku7s29s5e5qerz	i3drl6jajs2ilp2nqwn2rlsl	977 Trancio Tonno ATM		PIECE	\N	2025-11-25 14:53:15.269	2025-11-25 14:53:15.269	\N
zetk5mpgoo2ut0vbkpxjo41y	i3drl6jajs2ilp2nqwn2rlsl	680 Trancio Tonno BIG BLUE		PIECE	\N	2025-11-25 14:53:16.13	2025-11-25 14:53:16.13	\N
s5mpanemkp7cizwrii3p55th	i3drl6jajs2ilp2nqwn2rlsl	216 Trancio Spada ATM		PIECE	\N	2025-11-25 14:53:16.909	2025-11-25 14:53:16.909	\N
o6zsg6bstx3bo4uxdll6rpi0	i3drl6jajs2ilp2nqwn2rlsl	104 Fil. Panga sio Rosa		PIECE	\N	2025-11-25 14:53:17.58	2025-11-25 14:53:17.58	\N
t7of5xenrprsbh1rw291fddr	i3drl6jajs2ilp2nqwn2rlsl	042 Fil. Persico  Anova		PIECE	\N	2025-11-25 14:53:18.27	2025-11-25 14:53:18.27	\N
eb8ksvx9hm2378de4e49f7ol	i3drl6jajs2ilp2nqwn2rlsl	363 Filetto Baccalà  Salato		PIECE	\N	2025-11-25 14:53:19.026	2025-11-25 14:53:19.026	\N
espzyjzfayt712zpno3pnwts	i3drl6jajs2ilp2nqwn2rlsl	544 Trota Bianca		PIECE	\N	2025-11-25 14:53:19.783	2025-11-25 14:53:19.783	\N
rf46u9rs2ygt43gxbs50ai2a	i3drl6jajs2ilp2nqwn2rlsl	377 Trota Salmonata		PIECE	\N	2025-11-25 14:53:20.425	2025-11-25 14:53:20.425	\N
znr74l1zya3ucp7485jsvhx0	i3drl6jajs2ilp2nqwn2rlsl	449 Salicornia		PIECE	\N	2025-11-25 14:53:21.177	2025-11-25 14:53:21.177	\N
mj6qgqpx8fhkxabalusgbsm1	i3drl6jajs2ilp2nqwn2rlsl	004 Lupini Mezzani		PIECE	\N	2025-11-25 14:53:21.86	2025-11-25 14:53:21.86	\N
l2h2te27679ypvxwvvpn07aw	i3drl6jajs2ilp2nqwn2rlsl	006 Lupini Turbo		PIECE	\N	2025-11-25 14:53:22.529	2025-11-25 14:53:22.529	\N
ytdqu9xnvh5vvh9gtaocsp3c	i3drl6jajs2ilp2nqwn2rlsl	486 Lupini Magnum		PIECE	\N	2025-11-25 14:53:23.166	2025-11-25 14:53:23.166	\N
mjsvi20eou9yx47d71yy3w74	i3drl6jajs2ilp2nqwn2rlsl	684 Lupini Bombo		PIECE	\N	2025-11-25 14:53:23.793	2025-11-25 14:53:23.793	\N
qkbgnccnh2uqhm3okddd81yq	i3drl6jajs2ilp2nqwn2rlsl	126 Vongole Veraci Italia		PIECE	\N	2025-11-25 14:53:24.428	2025-11-25 14:53:24.428	\N
n2bbpkr2u9hxoaezdcf61hhs	i3drl6jajs2ilp2nqwn2rlsl	707 Vongole Veraci Portogallo		PIECE	\N	2025-11-25 14:53:25.067	2025-11-25 14:53:25.067	\N
rv64r4uma5c10f0eg93fcvh7	i3drl6jajs2ilp2nqwn2rlsl	459 Cozze Adria Italia		PIECE	\N	2025-11-25 14:53:25.98	2025-11-25 14:53:25.98	\N
hl9s7sdb36mzk996dehbj4b5	i3drl6jajs2ilp2nqwn2rlsl	003 Cozze Sardegna		PIECE	\N	2025-11-25 14:53:26.644	2025-11-25 14:53:26.644	\N
crxm4702f1s92kwlxxhqsjga	i3drl6jajs2ilp2nqwn2rlsl	496 Cozze Treccia		PIECE	\N	2025-11-25 14:53:27.278	2025-11-25 14:53:27.278	\N
t4md8rl6um1gawvzaja0jend	i3drl6jajs2ilp2nqwn2rlsl	012 Ostriche  8/10  x1kg Francia		KG	\N	2025-11-25 14:53:27.932	2025-11-25 14:53:27.932	\N
fk7ufraon688uf1lih1mkm2h	i3drl6jajs2ilp2nqwn2rlsl	010 Ostriche 8/10  Francia		PIECE	\N	2025-11-25 14:53:28.733	2025-11-25 14:53:28.733	\N
ikoiqhze8dk49dtd5ixriu44	i3drl6jajs2ilp2nqwn2rlsl	013 Ostriche 12/14  Francia		PIECE	\N	2025-11-25 14:53:29.373	2025-11-25 14:53:29.373	\N
iatqslqldyz74w79qfbv35if	i3drl6jajs2ilp2nqwn2rlsl	064 Salmone 4/5		PIECE	\N	2025-11-25 14:53:30.009	2025-11-25 14:53:30.009	\N
qtk7o35muk5fsde3kx0hwx3m	i3drl6jajs2ilp2nqwn2rlsl	569 Salmone 5/6		PIECE	\N	2025-11-25 14:53:30.64	2025-11-25 14:53:30.64	\N
s8sjf8wr0ul9dw55yshr3cba	i3drl6jajs2ilp2nqwn2rlsl	583 Insalata Mare 1kg		KG	\N	2025-11-25 14:53:31.29	2025-11-25 14:53:31.29	\N
jm5jd5fmgekohz53v8aw3ffe	i3drl6jajs2ilp2nqwn2rlsl	706 Filetto Salmone Aff. 160g (al pz)		PIECE	\N	2025-11-25 14:53:31.925	2025-11-25 14:53:31.925	\N
lparkkxh1s05gic6ys2gwc01	i3drl6jajs2ilp2nqwn2rlsl	629 Alici Marinate 1kg		KG	\N	2025-11-25 14:53:32.554	2025-11-25 14:53:32.554	\N
tjjf8r8k05ji2b0lj77t0huk	i3drl6jajs2ilp2nqwn2rlsl	122 Astici Canada		PIECE	\N	2025-11-25 14:53:33.191	2025-11-25 14:53:33.191	\N
yuvv52ahsk5bcow2ofjj5axh	i3drl6jajs2ilp2nqwn2rlsl	387 Pezzogna 600/800		PIECE	\N	2025-11-25 14:53:33.824	2025-11-25 14:53:33.824	\N
oyoke17ediro77vryjpqyuyn	i3drl6jajs2ilp2nqwn2rlsl	390 Ricciola 800/1300		PIECE	\N	2025-11-25 14:53:34.457	2025-11-25 14:53:34.457	\N
arjjbb7u0w6py9dekgv2i08k	i3drl6jajs2ilp2nqwn2rlsl	376 Coda Rospo 1000/2000		PIECE	\N	2025-11-25 14:53:35.092	2025-11-25 14:53:35.092	\N
z8f381tlzgs5hab5xxf5xe90	i3drl6jajs2ilp2nqwn2rlsl	239 Spinarolo G		PIECE	\N	2025-11-25 14:53:35.722	2025-11-25 14:53:35.722	\N
czmztxp7rd5w4xz0abn4gzc0	i3drl6jajs2ilp2nqwn2rlsl	Filetti Brotula		PIECE	\N	2025-11-25 14:53:37.04	2025-11-25 14:53:37.04	\N
xvu8j5rooedopz401tj1g3cb	i3drl6jajs2ilp2nqwn2rlsl	Nasello Spagna 700/1000		PIECE	\N	2025-11-25 14:53:37.676	2025-11-25 14:53:37.676	\N
pqtbeamjs4bfmvhot5i6heer	i3drl6jajs2ilp2nqwn2rlsl	502 Astici Canada 450/550gr.		PIECE	\N	2025-11-25 14:53:38.317	2025-11-25 14:53:38.317	\N
sv7h81txk51bw59vh02yq121	i3drl6jajs2ilp2nqwn2rlsl	085 Aragosta Locale Cong.		PIECE	\N	2025-11-25 14:53:38.95	2025-11-25 14:53:38.95	\N
uc6s7ibxszagk2a7uw7h82aq	i3drl6jajs2ilp2nqwn2rlsl	052 Gambero Rosso I Sicilia		PIECE	\N	2025-11-25 14:53:39.66	2025-11-25 14:53:39.66	\N
rlja3bh1lnbhqxhqi5an95ri	i3drl6jajs2ilp2nqwn2rlsl	739 Filetti Alici  IQF		PIECE	\N	2025-11-25 14:53:40.307	2025-11-25 14:53:40.307	\N
i1i57rpuxzo9u9up0yufakxl	i3drl6jajs2ilp2nqwn2rlsl	526 Polpo Verace Spagna Cong.		PIECE	\N	2025-11-25 14:53:40.941	2025-11-25 14:53:40.941	\N
efeixrmvxgpt2xf55pjuubd7	i3drl6jajs2ilp2nqwn2rlsl	224 Calamari 2P iqf terra		PIECE	\N	2025-11-25 14:53:41.573	2025-11-25 14:53:41.573	\N
xebmo7biv9pvvuzgedko6r02	i3drl6jajs2ilp2nqwn2rlsl	358 Calamari 3P iqf terra		PIECE	\N	2025-11-25 14:53:42.21	2025-11-25 14:53:42.21	\N
zu128cueqs9uzlrnkqg7iwcg	i3drl6jajs2ilp2nqwn2rlsl	710 Calamari 4P iqf terra		PIECE	\N	2025-11-25 14:53:42.938	2025-11-25 14:53:42.938	\N
gctjx5db9kbrx056464piz78	i3drl6jajs2ilp2nqwn2rlsl	224 Calamari 2P iqf bordo		PIECE	\N	2025-11-25 14:53:43.584	2025-11-25 14:53:43.584	\N
qi5emas7v0df86s06hwcvqkr	i3drl6jajs2ilp2nqwn2rlsl	527 Polpo T4 iqf		PIECE	\N	2025-11-25 14:53:44.214	2025-11-25 14:53:44.214	\N
aoxefa6ebd9zjy6z9jfsp2xm	i3drl6jajs2ilp2nqwn2rlsl	528 Polpo T5 iqf		PIECE	\N	2025-11-25 14:53:44.846	2025-11-25 14:53:44.846	\N
iqimxucm4wmc1fsjisbzmwjy	i3drl6jajs2ilp2nqwn2rlsl	057 Polpo T6 iqf		PIECE	\N	2025-11-25 14:53:45.476	2025-11-25 14:53:45.476	\N
t3kyx0mbkn6q362q2gkpruxe	i3drl6jajs2ilp2nqwn2rlsl	225 Puntillas		PIECE	\N	2025-11-25 14:53:46.107	2025-11-25 14:53:46.107	\N
t2d5lczyuezcatnd1f51vbks	i3drl6jajs2ilp2nqwn2rlsl	135 Seppia Pulita 1/2		PIECE	\N	2025-11-25 14:53:46.738	2025-11-25 14:53:46.738	\N
mv8aoozxeo8djofbjni1t27h	i3drl6jajs2ilp2nqwn2rlsl	252 Salmone Sockey 5/8		PIECE	\N	2025-11-25 14:53:47.368	2025-11-25 14:53:47.368	\N
jm44lvj71itqf8dy9qe18672	i3drl6jajs2ilp2nqwn2rlsl	487 Salmone Sockey 4/6		PIECE	\N	2025-11-25 14:53:48.005	2025-11-25 14:53:48.005	\N
r3lm9qpzoq425ban3u8pa0y8	i3drl6jajs2ilp2nqwn2rlsl	438 Filetto Salmone Sockey		PIECE	\N	2025-11-25 14:53:48.637	2025-11-25 14:53:48.637	\N
ws6nridhdfxsikjzo5clcacd	i3drl6jajs2ilp2nqwn2rlsl	737 Filetto Salmone Norvegia		PIECE	\N	2025-11-25 14:53:49.267	2025-11-25 14:53:49.267	\N
t33wmiyhnlvj4rqxeo4ar5y9	i3drl6jajs2ilp2nqwn2rlsl	353 Fil. Merluzzo 1000/+ VISIR		PIECE	\N	2025-11-25 14:53:49.899	2025-11-25 14:53:49.899	\N
tnbahhbstoum3sw1qi16niih	i3drl6jajs2ilp2nqwn2rlsl	353 Fil. Merluzzo 2000+ VISIR		PIECE	\N	2025-11-25 14:53:50.538	2025-11-25 14:53:50.538	\N
v42iejklm1o9bjt26g68yaf5	i3drl6jajs2ilp2nqwn2rlsl	717 Filetto Salmone Argentato		PIECE	\N	2025-11-25 14:53:51.17	2025-11-25 14:53:51.17	\N
nw4kp82bb7rolfag09k2ifod	i3drl6jajs2ilp2nqwn2rlsl	616 Soaso 500/1000 Congelato		PIECE	\N	2025-11-25 14:53:51.873	2025-11-25 14:53:51.873	\N
trolkl5eh27qu1n8kfb6gvfp	i3drl6jajs2ilp2nqwn2rlsl	616 Soaso 800/1200 Congelato		PIECE	\N	2025-11-25 14:53:52.51	2025-11-25 14:53:52.51	\N
wf0cmno4udjlkwefvdq9fe27	i3drl6jajs2ilp2nqwn2rlsl	616 Soaso 1000/2000 Congelato		PIECE	\N	2025-11-25 14:53:53.143	2025-11-25 14:53:53.143	\N
vqier26cglaz6euvsg26brj7	i3drl6jajs2ilp2nqwn2rlsl	258 Gamberi Arg. L1		PIECE	\N	2025-11-25 14:53:53.779	2025-11-25 14:53:53.779	\N
u77vb3waixzmzx9zftpsuhs4	i3drl6jajs2ilp2nqwn2rlsl	IVA ESCLUSA  259 Gamberi Arg. L2		PIECE	\N	2025-11-25 14:53:54.413	2025-11-25 14:53:54.413	\N
vuxmga550zqmgsn61jrb5qn7	i3drl6jajs2ilp2nqwn2rlsl	142 Mazzancolla 20/30		PIECE	\N	2025-11-25 14:53:55.044	2025-11-25 14:53:55.044	\N
a0bebb53yngks013qmyqmsdj	i3drl6jajs2ilp2nqwn2rlsl	151 Mazzancolla 30/40		PIECE	\N	2025-11-25 14:53:55.679	2025-11-25 14:53:55.679	\N
tdwc340elq6vilfdeb9tlk2f	i3drl6jajs2ilp2nqwn2rlsl	294 Calamari U/10 Indopacific.		PIECE	\N	2025-11-25 14:53:56.318	2025-11-25 14:53:56.318	\N
tvs9nfntyk2go3m654hd43eb	i3drl6jajs2ilp2nqwn2rlsl	288 Calamari U/5 Indopacifi.		PIECE	\N	2025-11-25 14:53:56.955	2025-11-25 14:53:56.955	\N
ibjo89jcvsstew8l48tun8je	i3drl6jajs2ilp2nqwn2rlsl	208 Calamari C4L		PIECE	\N	2025-11-25 14:53:57.588	2025-11-25 14:53:57.588	\N
f8f21osv04qcdlek3rlu7gdp	i3drl6jajs2ilp2nqwn2rlsl	727 Tentacoli Totano Tagliati Cotti		PIECE	\N	2025-11-25 14:53:58.217	2025-11-25 14:53:58.217	\N
zrwk9ozpe059ce3wthl6wh2v	i3drl6jajs2ilp2nqwn2rlsl	646 Tentacolo Totano  L		PIECE	\N	2025-11-25 14:53:58.85	2025-11-25 14:53:58.85	\N
zyi0niimz0inc7zk5v0g34qh	i3drl6jajs2ilp2nqwn2rlsl	533 Polpetti 60 UP		PIECE	\N	2025-11-25 14:53:59.483	2025-11-25 14:53:59.483	\N
yj8umsfesutn14eat572zxub	i3drl6jajs2ilp2nqwn2rlsl	144 Polpetti 40/60		PIECE	\N	2025-11-25 14:54:00.114	2025-11-25 14:54:00.114	\N
pni5bxr15wotmnmio6l61tbj	i3drl6jajs2ilp2nqwn2rlsl	138 Polpo 1000/2000		PIECE	\N	2025-11-25 14:54:00.751	2025-11-25 14:54:00.751	\N
xzhrsilutm6fkdvvs9be4m5h	i3drl6jajs2ilp2nqwn2rlsl	723 Polpo in Vaschetta 1kg		KG	\N	2025-11-25 14:54:01.386	2025-11-25 14:54:01.386	\N
lh417judr1a6guz5ztsrcx1j	i3drl6jajs2ilp2nqwn2rlsl	372 Scampi 1/5 Porcupine		PIECE	\N	2025-11-25 14:54:02.023	2025-11-25 14:54:02.023	\N
dmr0pa2wrgmo6ankeelw1cww	i3drl6jajs2ilp2nqwn2rlsl	321 Scampi 6/10 Porcupine		PIECE	\N	2025-11-25 14:54:02.652	2025-11-25 14:54:02.652	\N
rux2csau85849thfozipu0tn	i3drl6jajs2ilp2nqwn2rlsl	443 Scampi 11/15 Porcupine		PIECE	\N	2025-11-25 14:54:03.291	2025-11-25 14:54:03.291	\N
qxha9a6smn3379ltsam2yap0	i3drl6jajs2ilp2nqwn2rlsl	432 Scampi 16/20 Porcupine		PIECE	\N	2025-11-25 14:54:03.925	2025-11-25 14:54:03.925	\N
djn4bnkecg3p8bgmzw5dr1jk	i3drl6jajs2ilp2nqwn2rlsl	504 Scampi 21/30 Porcupine		PIECE	\N	2025-11-25 14:54:04.552	2025-11-25 14:54:04.552	\N
z4r19rceq956zjzp1u5wi4lm	i3drl6jajs2ilp2nqwn2rlsl	197 Scampi 41/50 Porcupine		PIECE	\N	2025-11-25 14:54:05.192	2025-11-25 14:54:05.192	\N
hqqgjxlkbx5yj32yirspr7f3	i3drl6jajs2ilp2nqwn2rlsl	745 Seppie Nere 100/300		PIECE	\N	2025-11-25 14:54:05.827	2025-11-25 14:54:05.827	\N
se4tn5mv24k3zz7exhb1g2yr	i3drl6jajs2ilp2nqwn2rlsl	433 Spiedini		PIECE	\N	2025-11-25 14:54:06.528	2025-11-25 14:54:06.528	\N
yq5vb8xjnflyg5zafpsulffg	i3drl6jajs2ilp2nqwn2rlsl	489 Gambero Rosso XL		PIECE	\N	2025-11-25 14:54:07.165	2025-11-25 14:54:07.165	\N
xueu35n4pn1me3roauhe967j	xxevpbrra70t4616xwtbj2di	01035 ACQUA EGERIA  0,5 LT *24 PET LISCIA 0,50 CRT 24 4,50		L	\N	2025-11-25 14:54:07.975	2025-11-25 14:54:07.975	\N
lns2ogmc6589e9max6f2l46b	xxevpbrra70t4616xwtbj2di	01034 ACQUA EGERIA 0,5 LT * 24 PET EFF. NAT. 0,50 CRT 24 4,50		L	\N	2025-11-25 14:54:08.607	2025-11-25 14:54:08.607	\N
un8g9m1mpdkerczg4ch43qqj	xxevpbrra70t4616xwtbj2di	01007 ACQUA LAURETANA CL 50*24  PET NAT 0,50 CRT 24 9,60		L	\N	2025-11-25 14:54:09.496	2025-11-25 14:54:09.496	\N
xn06mq2yjfqdaqxnueyx8iow	xxevpbrra70t4616xwtbj2di	01057 ACQUA LEVISSIMA FRIZ 0.50*24 PET 0,50 CRT 24 6,45		L	\N	2025-11-25 14:54:10.773	2025-11-25 14:54:10.773	\N
phw04unwn4wjewijbhrrmidh	xxevpbrra70t4616xwtbj2di	01052 ACQUA LEVISSIMA NAT 0.50*24 PE T 0,50 CRT 24 6,45		L	\N	2025-11-25 14:54:11.411	2025-11-25 14:54:11.411	\N
nk7eeml4f5zma9dmx5uw1utx	xxevpbrra70t4616xwtbj2di	01022 ACQUA NEPI CL 50*24 PET EFF.NAT 0,50 CRT 24 5,10		L	\N	2025-11-25 14:54:12.043	2025-11-25 14:54:12.043	\N
e5ayvh8mrw1jy2i3kq4iaoua	xxevpbrra70t4616xwtbj2di	01091 ACQUA PANNA CL 50 X 24 PET 0,50 CRT 24 10,50		L	\N	2025-11-25 14:54:12.67	2025-11-25 14:54:12.67	\N
idf2qdkzz50oqlmjs4fzwtg4	xxevpbrra70t4616xwtbj2di	01044 ACQUA S. BENED. MINI TOWER NAT CL50*28 PET 0,50 CRT 28 6,00		L	\N	2025-11-25 14:54:13.306	2025-11-25 14:54:13.306	\N
o5hppt93oeza927kaq2ufp62	xxevpbrra70t4616xwtbj2di	0,700 lt  DLD002		L	\N	2025-11-25 15:11:16.726	2025-11-25 15:11:16.726	\N
cbkec478m8a9ax21n9bo4x8r	i3drl6jajs2ilp2nqwn2rlsl	106 Spigole 3/4  A		PIECE	\N	2025-11-25 14:52:55.228	2025-11-25 14:52:55.228	\N
rwh3kuw00b7sgzxck63z55m6	i3drl6jajs2ilp2nqwn2rlsl	555 Spigole 4/6  G		PIECE	\N	2025-11-25 14:52:56.093	2025-11-25 14:52:56.093	\N
oygxgvy8jjraivszgcp8n02q	i3drl6jajs2ilp2nqwn2rlsl	346 Spigole 6/8 2G		PIECE	\N	2025-11-25 14:52:56.761	2025-11-25 14:52:56.761	\N
p40458u8vpy2x1erjap80zij	i3drl6jajs2ilp2nqwn2rlsl	340 Spigole 8/1000 3G		PIECE	\N	2025-11-25 14:52:57.392	2025-11-25 14:52:57.392	\N
dxpdq25d9r68igouefzq66ly	i3drl6jajs2ilp2nqwn2rlsl	233 Spigola 1000  4G		PIECE	\N	2025-11-25 14:52:58.02	2025-11-25 14:52:58.02	\N
u6pczrt7t9fag3x7eu9nqm22	i3drl6jajs2ilp2nqwn2rlsl	327 Spigola 1 000/1500 5G		PIECE	\N	2025-11-25 14:52:58.654	2025-11-25 14:52:58.654	\N
iq89ik8uqrg2oy9r7ajgqzv4	i3drl6jajs2ilp2nqwn2rlsl	330 Spigola 1500 /+ 6G		PIECE	\N	2025-11-25 14:52:59.288	2025-11-25 14:52:59.288	\N
ubi16i54llkzz613ja6n1ngw	i3drl6jajs2ilp2nqwn2rlsl	265 Spigola 2000/+ 7G (preordine)		PIECE	\N	2025-11-25 14:52:59.922	2025-11-25 14:52:59.922	\N
hdo6p8npzppq2kuiuel1rzh1	i3drl6jajs2ilp2nqwn2rlsl	238 Orata 3/4 A		PIECE	\N	2025-11-25 14:53:00.563	2025-11-25 14:53:00.563	\N
ptn1dz2iv91l3ismd4owxxpj	i3drl6jajs2ilp2nqwn2rlsl	261 Orata 4/6  G		PIECE	\N	2025-11-25 14:53:01.211	2025-11-25 14:53:01.211	\N
hxuflqlay5fquw40cqqlgzyt	i3drl6jajs2ilp2nqwn2rlsl	347 Orata 6/8  2G		PIECE	\N	2025-11-25 14:53:01.841	2025-11-25 14:53:01.841	\N
m0g7jludxzwohu12r1k26yao	i3drl6jajs2ilp2nqwn2rlsl	350 Orata 8/1000  3G		PIECE	\N	2025-11-25 14:53:02.473	2025-11-25 14:53:02.473	\N
efbgv2b3bqib8fcnf9tv87t5	i3drl6jajs2ilp2nqwn2rlsl	386 Orata 1000 4G		PIECE	\N	2025-11-25 14:53:03.106	2025-11-25 14:53:03.106	\N
gikg2wwuy6bs4eihnb0wr8j5	i3drl6jajs2ilp2nqwn2rlsl	540 Orata 1000/1500 5G		PIECE	\N	2025-11-25 14:53:03.748	2025-11-25 14:53:03.748	\N
zl8pphfg9ik1ast0ienyoj9h	i3drl6jajs2ilp2nqwn2rlsl	201 Orata1500/+ 6G		PIECE	\N	2025-11-25 14:53:04.384	2025-11-25 14:53:04.384	\N
f4gpi00emfws5up9ncscql3v	i3drl6jajs2ilp2nqwn2rlsl	355 Gallinella 7 00/1000		PIECE	\N	2025-11-25 14:53:05.026	2025-11-25 14:53:05.026	\N
yamixxa68e1xfwngq3qwzl1d	xxevpbrra70t4616xwtbj2di	01017 ACQUA S. BENEDETTO DI POP. CL.50*24  FR 0,50 CRT 24 4,95		L	\N	2025-11-25 14:54:13.943	2025-11-25 14:54:13.943	\N
uf7ipr0sbzy46vmca3zsdjqy	xxevpbrra70t4616xwtbj2di	01020 ACQUA S. BENEDETTO DI POP. CL.50*24  NAT 0,50 CRT 24 4,95		L	\N	2025-11-25 14:54:14.582	2025-11-25 14:54:14.582	\N
eujn7k1g3ljt7g3l5epid65v	xxevpbrra70t4616xwtbj2di	01031 ACQUA S. BENEDETTO DI POP. CL.50 * 24  L 0,50 CRT 24 4,95		L	\N	2025-11-25 14:54:15.218	2025-11-25 14:54:15.218	\N
b7pna28829tmj6c6dqxty1xf	xxevpbrra70t4616xwtbj2di	01014 ACQUA S.PELLEGRINO CL 50 X 24 FRIZZ. PET 0,50 CRT 24 10,95		L	\N	2025-11-25 14:54:15.854	2025-11-25 14:54:15.854	\N
r7mutq55u30c6xbvfma1pip7	xxevpbrra70t4616xwtbj2di	01104 ACQUA TULLIA CL 50X24 PET LEGG .FRIZ. 0,50 CRT 24 4,73		L	\N	2025-11-25 14:54:16.487	2025-11-25 14:54:16.487	\N
sdhxnhpk5rrlmei68bpk3vkw	xxevpbrra70t4616xwtbj2di	01103 ACQUA TULLIA CL 50X24 PET NAT 0,50 CRT 24 4,73		L	\N	2025-11-25 14:54:17.118	2025-11-25 14:54:17.118	\N
yxdxb2uozc28oecgbk891u1i	xxevpbrra70t4616xwtbj2di	01012 ACQUA EGERIA LITRO PET X 12 EFF.NAT. 1,00 CRT 12 4,73		BOX	\N	2025-11-25 14:54:17.754	2025-11-25 14:54:17.754	\N
xkxxcfq9rmz72hz9wg436198	xxevpbrra70t4616xwtbj2di	01013 ACQUA EGERIA LITRO PET X 12 LISCIA 1,00 CRT 12 4,73		BOX	\N	2025-11-25 14:54:18.391	2025-11-25 14:54:18.391	\N
rjmfxxkt2caha4b2zdu2tadf	xxevpbrra70t4616xwtbj2di	01041 ACQUA NEPI LITRO PET TOWER *12 1,00 CRT 12 4,95		BOX	\N	2025-11-25 14:54:19.025	2025-11-25 14:54:19.025	\N
txm775b1vowgu0a94yt7g3ly	xxevpbrra70t4616xwtbj2di	01040 ACQUA S. BENED. TOWER PET NAT.  LT 1 X 12 1,00 CRT 12 4,88		BOX	\N	2025-11-25 14:54:19.66	2025-11-25 14:54:19.66	\N
ooyo8x6di1pj1as2onuxlm15	xxevpbrra70t4616xwtbj2di	01106 ACQUA TULLIA LT 1X12 PET LEGG. FRIZZ. 1,00 CRT 12 4,95		BOX	\N	2025-11-25 14:54:20.297	2025-11-25 14:54:20.297	\N
ekp6fpuh9jc8us4ixuptv0vk	xxevpbrra70t4616xwtbj2di	01105 ACQUA TULLIA LT 1X12 PET NAT 1,00 CRT 12 4,95		BOX	\N	2025-11-25 14:54:21.01	2025-11-25 14:54:21.01	\N
wr8s7hqtfrh48jfj4axcr80r	xxevpbrra70t4616xwtbj2di	01033 ACQUA EGERIA 1,5 LT *6 PET EFF. NAT 1,50 CRT 6 2,85		L	\N	2025-11-25 14:54:21.713	2025-11-25 14:54:21.713	\N
t11hglcxk9l6nbn2juecgywh	xxevpbrra70t4616xwtbj2di	01048 ACQUA LAURETANA NAT. LT 1,5*6 1,50 CRT 6 4,13		L	\N	2025-11-25 14:54:22.345	2025-11-25 14:54:22.345	\N
dnq1s2bky084acklqc83iuen	xxevpbrra70t4616xwtbj2di	01023 ACQUA NEPI  LT. 1,5 * 6 PET EFF.NAT 1,50 CRT 6 3,45		L	\N	2025-11-25 14:54:22.985	2025-11-25 14:54:22.985	\N
qs95b9rw3l34f1u6rj2igl8l	xxevpbrra70t4616xwtbj2di	01036 ACQUA S. BENEDETTO DI POP. LT.1.5*6 NAT. 1,50 CRT 6 2,70		L	\N	2025-11-25 14:54:23.618	2025-11-25 14:54:23.618	\N
q0kuondihey6m8em9y5eynui	xxevpbrra70t4616xwtbj2di	01068 ACQUA S. BENEDETTO DI POP. LT 1,5 FRIZZ. 1,50 CRT 6 2,70		L	\N	2025-11-25 14:54:24.253	2025-11-25 14:54:24.253	\N
sbq4vgmgq9lssb1vftejd8qp	xxevpbrra70t4616xwtbj2di	01130 ACQUA TULLIA LT 1,5 X 6 LEGGER  MENTE FRIZZ. 1,50 CRT 6 2,63		L	\N	2025-11-25 14:54:24.918	2025-11-25 14:54:24.918	\N
d75rwpnj7urwapd0uczgnma9	xxevpbrra70t4616xwtbj2di	01123 ACQUA TULLIA LT 1,5 X 6 NAT. 1,50 CRT 6 2,63		L	\N	2025-11-25 14:54:25.551	2025-11-25 14:54:25.551	\N
shmcpc85jphzbmvdlaypwyeq	xxevpbrra70t4616xwtbj2di	01119 ACQUA LAURETANA 50X20 VAR FRIZ 0,50 CES 20 6,98		L	\N	2025-11-25 14:54:26.185	2025-11-25 14:54:26.185	\N
utqwnvhonttsqn68iucaovl2	xxevpbrra70t4616xwtbj2di	01120 ACQUA LAURETANA 50X20 VAR NAT. 0,50 CES 20 6,98		L	\N	2025-11-25 14:54:26.815	2025-11-25 14:54:26.815	\N
q07uk0vazwx16ujckh2rrpyu	xxevpbrra70t4616xwtbj2di	01042 ACQUA NEPI CL 50*20 VAR EFF.NA T. 0,50 CES 20 5,25		L	\N	2025-11-25 14:54:27.444	2025-11-25 14:54:27.444	\N
wljzjrwzhij59ck9lb93zlod	xxevpbrra70t4616xwtbj2di	01143 ACQUA PANNA CL 50 X 20 VAR 0,50 CES 20 9,00		L	\N	2025-11-25 14:54:28.079	2025-11-25 14:54:28.079	\N
ioem192270tuxyhx36kn236w	xxevpbrra70t4616xwtbj2di	01142 ACQUA S.PELLEGRINO CL 50 X 20 VAR 0,50 CES 20 9,00		L	\N	2025-11-25 14:54:28.711	2025-11-25 14:54:28.711	\N
f85a71abjwmfxusfv0yampqe	xxevpbrra70t4616xwtbj2di	01003 ACQUA LAURETANA  75*12 VAR NAT 0,75 CES 12 8,10		L	\N	2025-11-25 14:54:29.341	2025-11-25 14:54:29.341	\N
man47idgtoy26u0zumby82ig	xxevpbrra70t4616xwtbj2di	01004 ACQUA LAURETANA 75*12 VAR FRIZ. 0,75 CES 12 8,10		L	\N	2025-11-25 14:54:29.977	2025-11-25 14:54:29.977	\N
m20ysfxlarb3ptrw4iuad6ao	xxevpbrra70t4616xwtbj2di	01028 ACQUA NEPI CL 75  V.A.R EFF.NAT *12 0,75 CES 12 5,25		L	\N	2025-11-25 14:54:30.609	2025-11-25 14:54:30.609	\N
krgt5zfcgeh43s3fq9ea43jf	xxevpbrra70t4616xwtbj2di	01069 ACQUA NEPI CL 75X12 VAR FRIZZ. 0,75 CES 12 5,25		L	\N	2025-11-25 14:54:31.247	2025-11-25 14:54:31.247	\N
g5kjg3jnlql15anadq2uib8i	xxevpbrra70t4616xwtbj2di	01000 ACQUA PANNA CL 75 X 16 VAR 0,75 CES 16 10,50		L	\N	2025-11-25 14:54:31.933	2025-11-25 14:54:31.933	\N
db3mwuuawzrzcjjafc91diek	xxevpbrra70t4616xwtbj2di	01056 ACQUA S. BENEDETTO CL 75*12 VAR NAT 0,75 CES 12 5,25		L	\N	2025-11-25 14:54:32.577	2025-11-25 14:54:32.577	\N
m6vrd7l69b7qgct8bt0vaq2r	xxevpbrra70t4616xwtbj2di	01001 ACQUA S.PELLEGRINO CL 75 X 16 VAR 0,75 CES 16 10,50		L	\N	2025-11-25 14:54:33.207	2025-11-25 14:54:33.207	\N
scg7qhdyfyv1czyncp41o33d	xxevpbrra70t4616xwtbj2di	01113 ACQUA TULLIA CL 75*12 VAR FRIZ UNICA 0,75 CES 12 5,10		L	\N	2025-11-25 14:54:33.841	2025-11-25 14:54:33.841	\N
x5ovmb8o9na9iu1ag9hffmx9	xxevpbrra70t4616xwtbj2di	01110 ACQUA TULLIA CL 75*12 VAR LEGG .FRIZZ. 0,75 CES 12 5,10		L	\N	2025-11-25 14:54:34.47	2025-11-25 14:54:34.47	\N
md86lewjzeq5i477jenqb8si	xxevpbrra70t4616xwtbj2di	01109 ACQUA TULLIA CL 75*12 VAR NAT UNICA 0,75 CES 12 5,10		L	\N	2025-11-25 14:54:35.11	2025-11-25 14:54:35.11	\N
ihsg9xuldpapbcxa95fdfji9	xxevpbrra70t4616xwtbj2di	01067 ACQUA EGERIA LT VAR X 12 EFF.N AT. 1,00 CES 12 4,20		PIECE	\N	2025-11-25 14:54:35.843	2025-11-25 14:54:35.843	\N
m9j71wm2wuc0t3no6gy5kyrm	xxevpbrra70t4616xwtbj2di	01066 ACQUA EGERIA LT VAR X 12 LISCI A 1,00 CES 12 4,20		PIECE	\N	2025-11-25 14:54:36.475	2025-11-25 14:54:36.475	\N
lbn0p6mq6ckubkh7pq77wu3u	xxevpbrra70t4616xwtbj2di	01008 ACQUA LAURETANA NAT.1*12 VAR 1,00 CES 12 6,45		PIECE	\N	2025-11-25 14:54:37.181	2025-11-25 14:54:37.181	\N
mobpe3nftk2m0j4lwd4ch6fx	xxevpbrra70t4616xwtbj2di	01030 ACQUA NEPI LITRO *12 VAR EFF.NAT 1,00 CES 12 5,25		PIECE	\N	2025-11-25 14:54:37.815	2025-11-25 14:54:37.815	\N
jwcn2zkw23s3jbyax0m4igo4	xxevpbrra70t4616xwtbj2di	01037 ACQUA S. BENEDETTO  LITRO *12 VAR  NAT. 1,00 CES 12 5,25		PIECE	\N	2025-11-25 14:54:38.448	2025-11-25 14:54:38.448	\N
xnxe6zpptavvtex09rsxgc76	xxevpbrra70t4616xwtbj2di	01108 ACQUA TULLIA  LT 1*12 VAR LEGG .FRIZ.UNICA 1,00 CES 12 5,10		PIECE	\N	2025-11-25 14:54:39.08	2025-11-25 14:54:39.08	\N
usukwlngo1gbmiuvcmt7fuv1	xxevpbrra70t4616xwtbj2di	01107 ACQUA TULLIA  LT 1*12 VAR NAT UNICA 1,00 CES 12 5,10		PIECE	\N	2025-11-25 14:54:39.714	2025-11-25 14:54:39.714	\N
u39yxn00hv98qc7t5bt7vn84	xxevpbrra70t4616xwtbj2di	01144 ACQUA NEPI CL 65X16 VAR EFFERV .NAT. 0,65 CES 16 10,95		PIECE	\N	2025-11-25 14:54:40.345	2025-11-25 14:54:40.345	\N
o6kfhkdfxosw1dx0v6oc7fm6	xxevpbrra70t4616xwtbj2di	01079 ACQUA S. BENEDETTO MILLENIUM C L 65*16 VAR 0,65 CES 16 10,20		PIECE	\N	2025-11-25 14:54:40.988	2025-11-25 14:54:40.988	\N
m3i780qjhubavwfljyel4myp	xxevpbrra70t4616xwtbj2di	01122 ACQUA S. BENED. LATTINA FRIZZA  NTE CL33X24 0,33 CRT 24 9,23		BOX	\N	2025-11-25 14:54:41.624	2025-11-25 14:54:41.624	\N
uno9n6rss5p4m3lxmwaey119	xxevpbrra70t4616xwtbj2di	01121 ACQUA S. BENED. LATTINA NAT.CL  . 33 X 24 0,33 CRT 24 9,23		BOX	\N	2025-11-25 14:54:42.258	2025-11-25 14:54:42.258	\N
er57q5xufef4tbjtxsm0bjl7	xxevpbrra70t4616xwtbj2di	03009 APEROL SODA CL. 12,5 X 48 0,13 CRT 48 49,50		BOX	\N	2025-11-25 14:54:42.89	2025-11-25 14:54:42.89	\N
c08031jmr56l87bldbvu0ckl	xxevpbrra70t4616xwtbj2di	03000 CAMPARI SODA CC 10 X 100 0,10 CRT 100 99,00		BOX	\N	2025-11-25 14:54:43.531	2025-11-25 14:54:43.531	\N
pz45a2jei8jla0kaewaqi6r2	xxevpbrra70t4616xwtbj2di	03021 CRODINO "XL" GIALLO CL17,5*24 0,18 CRT 24 25,50		BOX	\N	2025-11-25 14:54:44.164	2025-11-25 14:54:44.164	\N
h22vpok3lpvd51e674n8mddi	xxevpbrra70t4616xwtbj2di	03020 CRODINO "XL" ROSSO CL 17,5*24 0,18 CRT 24 25,50		BOX	\N	2025-11-25 14:54:44.8	2025-11-25 14:54:44.8	\N
lpu7bco6uaryavcop8hiwgj3	xxevpbrra70t4616xwtbj2di	03007 CRODINO 48/10 CL 0,10 CRT 48 29,48		BOX	\N	2025-11-25 14:54:45.442	2025-11-25 14:54:45.442	\N
wb227bls6mhj7mdyamjxam2h	xxevpbrra70t4616xwtbj2di	03010 SANBITTER BIANCO CL.10*48 0,10 CRT 48 30,75		L	\N	2025-11-25 14:54:46.078	2025-11-25 14:54:46.078	\N
w3h8ybty87lstazhs56wl0sw	xxevpbrra70t4616xwtbj2di	03008 SANBITTER ROSSO VAP CL.10*48 0,10 CRT 48 30,75		L	\N	2025-11-25 14:54:46.721	2025-11-25 14:54:46.721	\N
e148ftvfbvqn79qne4pcebf6	xxevpbrra70t4616xwtbj2di	04091 CHINOTTO NERI CL.20*24 0,20 CRT 24 16,13		BOX	\N	2025-11-25 14:54:47.361	2025-11-25 14:54:47.361	\N
svj0eqlgqpqh9atonp3ccg6h	xxevpbrra70t4616xwtbj2di	04163 COCA COLA VETRO CL.20*24 VAP 0,20 CRT 24 19,50		BOX	\N	2025-11-25 14:54:48.004	2025-11-25 14:54:48.004	\N
gctepm75ejf5zamxbabjven1	xxevpbrra70t4616xwtbj2di	04257 FEVER TREE ELDEFLOWER ML200*24 0,20 CRT 24 26,25		L	\N	2025-11-25 14:54:48.636	2025-11-25 14:54:48.636	\N
ezkh1d5m8hbzybao59zeih8z	xxevpbrra70t4616xwtbj2di	04236 FEVER TREE GINGER  BEER  ML200*24 0,20 CRT 24 26,25		L	\N	2025-11-25 14:54:49.269	2025-11-25 14:54:49.269	\N
d4sbbdn1650frjgoxgc6ra9t	xxevpbrra70t4616xwtbj2di	04318 FEVER TREE LEMON TONIC  ML 200*24 0,20 CRT 24 26,25		L	\N	2025-11-25 14:54:49.914	2025-11-25 14:54:49.914	\N
w4vmhbk118wwtftsohb1wkgq	xxevpbrra70t4616xwtbj2di	04233 FEVER TREE MEDITERRANEO  ML200*24 0,20 CRT 24 26,25		L	\N	2025-11-25 14:54:50.553	2025-11-25 14:54:50.553	\N
vvkpc49nwgosjb5jc739w7jx	xxevpbrra70t4616xwtbj2di	04316 FEVER TREE POMPELMO ROSA  ML 200*24 0,20 CRT 24 26,25		L	\N	2025-11-25 14:54:51.187	2025-11-25 14:54:51.187	\N
v2r3oxc97o2imjlv1hkvem9u	xxevpbrra70t4616xwtbj2di	04251 FEVER TREE TONIC INDIAN PREMIU  M ML200*24 0,20 CRT 24 26,25		L	\N	2025-11-25 14:54:51.894	2025-11-25 14:54:51.894	\N
jwh9b417sjkns8kovtwrvjj5	xxevpbrra70t4616xwtbj2di	04218 GALVANINA SPRITZ ANALCOLICO CL 20*24 0,20 CRT 24 20,93		BOX	\N	2025-11-25 14:54:52.533	2025-11-25 14:54:52.533	\N
hsecg6irhpuohx22yj3125ad	xxevpbrra70t4616xwtbj2di	04296 GALVANINA TONICA BITTER LEMON  CL 20X24 0,20 CRT 24 20,93		BOX	\N	2025-11-25 14:54:53.187	2025-11-25 14:54:53.187	\N
js089uivo23rrj2byl9ay0ld	xxevpbrra70t4616xwtbj2di	04206 GALVANINA TONICA CLASSICA CL 20*24 0,20 CRT 24 20,93		BOX	\N	2025-11-25 14:54:53.822	2025-11-25 14:54:53.822	\N
r5soq13dwn8ckuhfevt1382w	xxevpbrra70t4616xwtbj2di	04327 GALVANINA TONICA GINGER ALE CL 20*24 0,20 CRT 24 20,93		BOX	\N	2025-11-25 14:54:54.466	2025-11-25 14:54:54.466	\N
tpk9r7emyn29lufhmx9yeeem	xxevpbrra70t4616xwtbj2di	04208 GALVANINA TONICA GINGER BEER CL 20*24 0,20 CRT 24 20,93		BOX	\N	2025-11-25 14:54:55.103	2025-11-25 14:54:55.103	\N
zid1ljb37wanx8i557k7rpnv	xxevpbrra70t4616xwtbj2di	04211 GALVANINA TONICA ITALIANA CL 20*24 0,20 CRT 24 20,93		BOX	\N	2025-11-25 14:54:55.737	2025-11-25 14:54:55.737	\N
t7z0qd6d1cdc3m0i2k5vqwls	xxevpbrra70t4616xwtbj2di	04210 GALVANINA TONICA MANDAR. VERDE CL 20*24 0,20 CRT 24 20,93		BOX	\N	2025-11-25 14:54:56.371	2025-11-25 14:54:56.371	\N
txn59o9d6dl373t1tdqrehmb	xxevpbrra70t4616xwtbj2di	04294 GALVANINA TONICA MEDITERRANEA CL 20*24 0,20 CRT 24 20,93		BOX	\N	2025-11-25 14:54:57.011	2025-11-25 14:54:57.011	\N
hnrqqkuk90x2b1lksn15a93c	xxevpbrra70t4616xwtbj2di	04209 GALVANINA TONICA POMP.GIALLO CL 20*24 0,20 CRT 24 20,93		BOX	\N	2025-11-25 14:54:57.646	2025-11-25 14:54:57.646	\N
odre5xisr33q7ob2zpv29euq	xxevpbrra70t4616xwtbj2di	04207 GALVANINA TONICA POMP.ROSA SPE CIAL CL 20*24 0,20 CRT 24 20,93		BOX	\N	2025-11-25 14:54:58.275	2025-11-25 14:54:58.275	\N
b0dletfxlw4j3k12yquc0xpc	xxevpbrra70t4616xwtbj2di	04252 KINLEY GINGER BEER CL 20 X 24 0,20 CRT 24 14,25		BOX	\N	2025-11-25 14:54:58.909	2025-11-25 14:54:58.909	\N
m1dr6ovy8hmu7utwoikzku38	xxevpbrra70t4616xwtbj2di	04239 KINLEY LIMONE CL 20 X 24 0,20 CRT 24 14,25		BOX	\N	2025-11-25 14:54:59.547	2025-11-25 14:54:59.547	\N
w209uhgn0l8pn3nyk8fsinxa	xxevpbrra70t4616xwtbj2di	04238 KINLEY TONICA CL 20 X 24 0,20 CRT 24 14,25		BOX	\N	2025-11-25 14:55:00.259	2025-11-25 14:55:00.259	\N
urq5jisoxu0dl8fpmvaqxoxq	xxevpbrra70t4616xwtbj2di	04032 LEMONSODA BOT.CL.20*24 0,20 CRT 24 13,50		BOX	\N	2025-11-25 14:55:00.889	2025-11-25 14:55:00.889	\N
kpxajgnrscqlwll4wvhwh1a6	xxevpbrra70t4616xwtbj2di	04134 LURISIA ARANCIATA CL 27,5 X 24 0,28 CRT 24 28,50		BOX	\N	2025-11-25 14:55:01.523	2025-11-25 14:55:01.523	\N
novzjisda935oh4vbnqubqz0	xxevpbrra70t4616xwtbj2di	04132 LURISIA CHINOTTO CL 27,5 X 24 0,28 CRT 24 28,50		BOX	\N	2025-11-25 14:55:02.193	2025-11-25 14:55:02.193	\N
ikvqul510wkz674qdkoi6ixw	xxevpbrra70t4616xwtbj2di	04133 LURISIA GASSOSA CL 27,5 X 24 0,28 CRT 24 28,50		BOX	\N	2025-11-25 14:55:02.822	2025-11-25 14:55:02.822	\N
fg0xbcpfmx615dd8cq4qmlps	xxevpbrra70t4616xwtbj2di	04324 LURISIA LIMONATA CL 27,5 X 24 0,28 CRT 24 28,50		BOX	\N	2025-11-25 14:55:03.457	2025-11-25 14:55:03.457	\N
ss3bfcm8sqr6o6xo1pkkoi4v	xxevpbrra70t4616xwtbj2di	04039 ORANSODA BOT. CL.20*24 0,20 CRT 24 13,50		BOX	\N	2025-11-25 14:55:04.088	2025-11-25 14:55:04.088	\N
d9m8jw1dnnjfge5u1ur7wywr	xxevpbrra70t4616xwtbj2di	04172 SAN PELLEG. ACQUA BRILLANTE C L 20X24 0,20 CRT 24 14,85		BOX	\N	2025-11-25 14:55:04.72	2025-11-25 14:55:04.72	\N
lm0f0ytgy1te7uhw4lhvxbvn	xxevpbrra70t4616xwtbj2di	04170 SAN PELLEG. CEDRATA CL.20X24 0,20 CRT 24 18,00		BOX	\N	2025-11-25 14:55:05.363	2025-11-25 14:55:05.363	\N
zov28o2fue5jnckibvwx6czg	xxevpbrra70t4616xwtbj2di	04171 SAN PELLEG. CHINOTTO CL.20X24 0,20 CRT 24 18,00		BOX	\N	2025-11-25 14:55:05.999	2025-11-25 14:55:05.999	\N
qihugcduy665j33swlqbn9j6	xxevpbrra70t4616xwtbj2di	04319 SAN PELLEG. GINGER BEER CL 20X24 0,20 CRT 24 18,00		BOX	\N	2025-11-25 14:55:06.632	2025-11-25 14:55:06.632	\N
fxbuoxpb8q17o79nmpwkua3v	xxevpbrra70t4616xwtbj2di	04071 SAN PELLEG.ARANC.AMARA CL20*24  BIO 0,20 CRT 24 18,00		BOX	\N	2025-11-25 14:55:07.334	2025-11-25 14:55:07.334	\N
v38861iint5s3ycbytk53d1h	xxevpbrra70t4616xwtbj2di	04173 SAN PELLEG.ARANC.DOLCE CL20 X 24 0,20 CRT 24 18,00		BOX	\N	2025-11-25 14:55:07.967	2025-11-25 14:55:07.967	\N
z5ppfns0wors6jwnpqegh8db	xxevpbrra70t4616xwtbj2di	04080 SAN PELLEG.COCKTAIL RED CL.20X 24 0,20 CRT 24 18,00		BOX	\N	2025-11-25 14:55:08.595	2025-11-25 14:55:08.595	\N
rq72qn8sf0z4vzlwqlktewlu	xxevpbrra70t4616xwtbj2di	04168 SAN PELLEG.TONICA ROVERE CL 20X24 0,20 CRT 24 18,00		BOX	\N	2025-11-25 14:55:09.229	2025-11-25 14:55:09.229	\N
d21osg2sjpr0htr5i1hygnl4	xxevpbrra70t4616xwtbj2di	04033 SCHWEPPES ARANCIO CL.18*24 0,18 CRT 24 16,05		BOX	\N	2025-11-25 14:55:09.864	2025-11-25 14:55:09.864	\N
bwl4fqm1i4lcx62xln5r49kr	xxevpbrra70t4616xwtbj2di	04085 SCHWEPPES GINGER ALECL18*24 0,18 CRT 24 18,75		BOX	\N	2025-11-25 14:55:10.499	2025-11-25 14:55:10.499	\N
av4b77189fm8koizh6f74flb	xxevpbrra70t4616xwtbj2di	04157 SCHWEPPES GINGER BEER CL18*24 0,18 CRT 24 18,75		BOX	\N	2025-11-25 14:55:11.136	2025-11-25 14:55:11.136	\N
sv8agd0h7u0s772jklw160uh	xxevpbrra70t4616xwtbj2di	04029 SCHWEPPES LIMONE CL.18*24 0,18 CRT 24 16,05		BOX	\N	2025-11-25 14:55:11.773	2025-11-25 14:55:11.773	\N
xnji7incarfzyba0kicyjhjb	xxevpbrra70t4616xwtbj2di	04277 SCHWEPPES POMP.ROSA CL.18*24 0,17 CRT 24 16,05		BOX	\N	2025-11-25 14:55:12.408	2025-11-25 14:55:12.408	\N
oocz7i95ceqnmu7eee3h22lt	xxevpbrra70t4616xwtbj2di	04302 SCHWEPPES SELECT. LEMON & QUIN INE CL 20*12 0,20 CRT 12 12,53		BOX	\N	2025-11-25 14:55:13.041	2025-11-25 14:55:13.041	\N
lc98gd2ok9rb69v6trfjx5em	xxevpbrra70t4616xwtbj2di	04329 SCHWEPPES SELECT. TON/BAS/LIM  CL 20*12 0,20 CRT 12 12,53		BOX	\N	2025-11-25 14:55:13.676	2025-11-25 14:55:13.676	\N
nzem0wyrtcogooftxqoo2sd1	xxevpbrra70t4616xwtbj2di	04291 SCHWEPPES SELECT. TONICA/lime CL 20*12 0,20 CRT 12 12,53		BOX	\N	2025-11-25 14:55:14.309	2025-11-25 14:55:14.309	\N
pqwi2mc51lyuog1m32b923h2	xxevpbrra70t4616xwtbj2di	04072 SCHWEPPES SODA VAP 18*24 0,18 CRT 24 18,75		BOX	\N	2025-11-25 14:55:14.939	2025-11-25 14:55:14.939	\N
qnsyu5pnlthuhdgoyw9wg39q	xxevpbrra70t4616xwtbj2di	0,700 lt  DLD011		L	\N	2025-11-25 15:11:17.374	2025-11-25 15:11:17.374	\N
no1fiiswejceloe34wx6oeke	xxevpbrra70t4616xwtbj2di	04028 SCHWEPPES TONICA CL.18*24 0,18 CRT 24 16,05		BOX	\N	2025-11-25 14:55:15.572	2025-11-25 14:55:15.572	\N
he8cib9qz6elkrgm3xc31vqg	xxevpbrra70t4616xwtbj2di	04221 TASSONI CEDRATA "ZERO" CL18*25 0,18 CRT 25 21,00		BOX	\N	2025-11-25 14:55:16.214	2025-11-25 14:55:16.214	\N
qjn5iz9y0i0ohfnwkkn2m2rr	xxevpbrra70t4616xwtbj2di	04043 TASSONI CEDRATA CL.18*25 0,18 CRT 25 21,00		BOX	\N	2025-11-25 14:55:16.847	2025-11-25 14:55:16.847	\N
vtpcovq24m3hukga8w42o79e	xxevpbrra70t4616xwtbj2di	04232 TASSONI CHINOTTO CL 18*25 0,18 CRT 25 21,00		BOX	\N	2025-11-25 14:55:17.482	2025-11-25 14:55:17.482	\N
khe7fva1vhrk2wzl54mc0061	xxevpbrra70t4616xwtbj2di	04222 TASSONI GINGER BEER CL.18*25 0,18 CRT 25 21,00		BOX	\N	2025-11-25 14:55:18.11	2025-11-25 14:55:18.11	\N
afqvhhhfug52j3xuqhbjr42n	xxevpbrra70t4616xwtbj2di	04231 TASSONI POMPELMO SODA CL 18 *25 0,18 CRT 25 21,00		BOX	\N	2025-11-25 14:55:18.748	2025-11-25 14:55:18.748	\N
m0sqn73nr4eipo08u1yn8gd2	xxevpbrra70t4616xwtbj2di	04226 TASSONI SODA WATER CL.18*25 0,18 CRT 25 21,00		BOX	\N	2025-11-25 14:55:19.381	2025-11-25 14:55:19.381	\N
b1p9chln1a3o3dcmc0ou2259	xxevpbrra70t4616xwtbj2di	04227 TASSONI TONICA SUPERFINE CL 18 *25 0,18 CRT 25 21,00		BOX	\N	2025-11-25 14:55:20.062	2025-11-25 14:55:20.062	\N
a3rqr1h24xjm1qoxtgvf2lhj	xxevpbrra70t4616xwtbj2di	04325 THE S. BENED. LIMONE DET. CL25 *24 0,25 CRT 24 12,90		BOX	\N	2025-11-25 14:55:20.695	2025-11-25 14:55:20.695	\N
lh5wb6enc4awljizq545nseu	xxevpbrra70t4616xwtbj2di	04326 THE S. BENED. PESCA DET. CL25 *24 0,25 CRT 24 12,90		BOX	\N	2025-11-25 14:55:21.376	2025-11-25 14:55:21.376	\N
xv7rsozisz5o4f0wky7mbrki	xxevpbrra70t4616xwtbj2di	04204 THE S.BEN.INDIAN BLACK LIMONE CL 25X16 0,25 CRT 16 19,50		BOX	\N	2025-11-25 14:55:22.013	2025-11-25 14:55:22.013	\N
s3f1iao1qv2075dnprnevi9i	xxevpbrra70t4616xwtbj2di	04205 THE S.BEN.INDIAN BLACK PESCA CL 25X16 0,25 CRT 16 19,50		BOX	\N	2025-11-25 14:55:22.718	2025-11-25 14:55:22.718	\N
hg6lr08ewbjebupdbq0z7i14	xxevpbrra70t4616xwtbj2di	04129 THOMAS HENRY BOTANICAL *24 0,20 CRT 24 31,50		L	\N	2025-11-25 14:55:23.348	2025-11-25 14:55:23.348	\N
vgz155qszvvidd2rgsjjzg65	xxevpbrra70t4616xwtbj2di	04154 THOMAS HENRY GINGER BEER*24 0,20 CRT 24 31,50		L	\N	2025-11-25 14:55:23.986	2025-11-25 14:55:23.986	\N
gvrp4hqiw6yzjsx1ry7hwfiz	xxevpbrra70t4616xwtbj2di	04245 THOMAS HENRY POMP.ROSA CL20*24 0,20 CRT 24 31,50		L	\N	2025-11-25 14:55:24.622	2025-11-25 14:55:24.622	\N
c6ugoqzpqt4i5v7xkub7o8n2	xxevpbrra70t4616xwtbj2di	04152 THOMAS HENRY TONIC WATER*24 0,20 CRT 24 31,50		L	\N	2025-11-25 14:55:25.259	2025-11-25 14:55:25.259	\N
nld2sbrkek84hjeckn47d7f1	xxevpbrra70t4616xwtbj2di	04147 THREE CENTS POMP.ROSA SODA CL 20X24 0,20 CRT 24 24,75		BOX	\N	2025-11-25 14:55:25.892	2025-11-25 14:55:25.892	\N
ld10mqwwuc63smbx58sgk7xe	xxevpbrra70t4616xwtbj2di	04148 THREE CENTS TONIC DRY CL 20 X 24 0,20 CRT 24 24,75		BOX	\N	2025-11-25 14:55:26.525	2025-11-25 14:55:26.525	\N
zmswrxuj8hohjcmg1mkzm9z1	xxevpbrra70t4616xwtbj2di	04180 THREE CENTS TONIC WATER CL 20  X 24 0,20 CRT 24 24,75		BOX	\N	2025-11-25 14:55:27.16	2025-11-25 14:55:27.16	\N
azve1oy3rp988lxtdar475kf	xxevpbrra70t4616xwtbj2di	04328 COCA "00" (zero/caff.free) CL 33X24 VETRO 0,33 CRT 24 19,50		BOX	\N	2025-11-25 14:55:27.794	2025-11-25 14:55:27.794	\N
dzpjjh21pt5qhnnx3szavkxa	xxevpbrra70t4616xwtbj2di	04013 COCA COLA CL 33 X 24 VETRO VAP 0,33 CRT 24 19,50		BOX	\N	2025-11-25 14:55:28.43	2025-11-25 14:55:28.43	\N
vro2nxo95gm8uh360419eaw6	xxevpbrra70t4616xwtbj2di	04015 COCA COLA ZERO CL 33 X 24 VETRO VAP 0,33 CRT 24 19,50		BOX	\N	2025-11-25 14:55:29.061	2025-11-25 14:55:29.061	\N
oxyw5srcyxk06m4mixptuq05	xxevpbrra70t4616xwtbj2di	04014 FANTA CL 33 X 24 VETRO VAP 0,33 CRT 24 19,50		BOX	\N	2025-11-25 14:55:29.699	2025-11-25 14:55:29.699	\N
us1rodpafx2xa7i57913vycu	xxevpbrra70t4616xwtbj2di	04261 GALVANINA AR.ROSSA ML 355X12 0,35 CRT 12 14,10		L	\N	2025-11-25 14:55:30.337	2025-11-25 14:55:30.337	\N
v1759z2f6j0e34v4w9uaqv2v	xxevpbrra70t4616xwtbj2di	04266 GALVANINA AR.ROSSA-MIRTILLO  ML355X12 0,35 CRT 12 14,10		L	\N	2025-11-25 14:55:30.971	2025-11-25 14:55:30.971	\N
u3k3kolycb7q0i8mckkw4wci	xxevpbrra70t4616xwtbj2di	04260 GALVANINA ARANCIATA ML 355X12 0,35 CRT 12 14,10		L	\N	2025-11-25 14:55:31.677	2025-11-25 14:55:31.677	\N
pfjxmxorh8wcoivl6e46j0lk	xxevpbrra70t4616xwtbj2di	04310 GALVANINA BERGAMOTTO ML 355X12 0,35 CRT 12 14,10		L	\N	2025-11-25 14:55:32.312	2025-11-25 14:55:32.312	\N
qrap87f9nymelsbylq7x1v7w	xxevpbrra70t4616xwtbj2di	04274 GALVANINA BIB.TONICA ML 355X12 0,35 CRT 12 14,10		L	\N	2025-11-25 14:55:32.945	2025-11-25 14:55:32.945	\N
pv1u2qf987xl9l37gxcc6tak	xxevpbrra70t4616xwtbj2di	04268 GALVANINA CEDRATA ML 355X12 0,35 CRT 12 14,10		L	\N	2025-11-25 14:55:33.594	2025-11-25 14:55:33.594	\N
orea2ez76bfy24tnd3imqiny	xxevpbrra70t4616xwtbj2di	04270 GALVANINA CHINOTTO ML 355X12 0,35 CRT 12 14,10		L	\N	2025-11-25 14:55:34.228	2025-11-25 14:55:34.228	\N
sks3xau4nzkivj2b9hfw6623	xxevpbrra70t4616xwtbj2di	04271 GALVANINA COLA ML 355X12 0,35 CRT 12 14,10		L	\N	2025-11-25 14:55:34.862	2025-11-25 14:55:34.862	\N
i1ihwjyb2hmky2k2eael1ww6	xxevpbrra70t4616xwtbj2di	04269 GALVANINA GASSOSA ML 355X12 0,35 CRT 12 14,10		L	\N	2025-11-25 14:55:35.501	2025-11-25 14:55:35.501	\N
yt20lma6xkbqs4y8ts1ijan1	xxevpbrra70t4616xwtbj2di	04273 GALVANINA GINGER BEER ML355X12 0,35 CRT 12 14,10		L	\N	2025-11-25 14:55:36.14	2025-11-25 14:55:36.14	\N
cpmn9hdxzjcg8j8x172okljg	xxevpbrra70t4616xwtbj2di	04262 GALVANINA LIMONATA ML 355X12 0,35 CRT 12 14,10		L	\N	2025-11-25 14:55:36.776	2025-11-25 14:55:36.776	\N
kolpn0bejp9mi99tdw5dczw4	xxevpbrra70t4616xwtbj2di	04265 GALVANINA MAND E FICO ML355X12 0,35 CRT 12 14,10		L	\N	2025-11-25 14:55:37.41	2025-11-25 14:55:37.41	\N
upzcgu3l31bgb2oqd1innu6p	xxevpbrra70t4616xwtbj2di	04264 GALVANINA MELAGRANA ML 355X12 0,35 CRT 12 14,10		PIECE	\N	2025-11-25 14:55:38.115	2025-11-25 14:55:38.115	\N
ty6acllb4vra0lb3nx0ilovr	xxevpbrra70t4616xwtbj2di	04263 GALVANINA POMP.ROSSO ML 355X12 0,35 CRT 12 14,10		L	\N	2025-11-25 14:55:38.749	2025-11-25 14:55:38.749	\N
bwc0esyswxaj96cih0h1yclu	xxevpbrra70t4616xwtbj2di	04119 GALVANINA THE BIANCO ML 355X12 0,35 CRT 12 14,10		L	\N	2025-11-25 14:55:39.385	2025-11-25 14:55:39.385	\N
h66h5euwjwx28abmv8n97aog	xxevpbrra70t4616xwtbj2di	04275 GALVANINA THE LIMONE ML 355X12 0,35 CRT 12 14,10		L	\N	2025-11-25 14:55:40.016	2025-11-25 14:55:40.016	\N
ja21zawlopkcvx9xy348otaa	xxevpbrra70t4616xwtbj2di	04276 GALVANINA THE PESCA ML 355X12 0,35 CRT 12 14,10		L	\N	2025-11-25 14:55:40.65	2025-11-25 14:55:40.65	\N
vaupcyiyta0xdtm46i5xghe1	xxevpbrra70t4616xwtbj2di	04115 GALVANINA THE VERDE ML 355X12 0,35 CRT 12 14,10		L	\N	2025-11-25 14:55:41.284	2025-11-25 14:55:41.284	\N
rt5h0dji2a0nin4u6yai7uv9	xxevpbrra70t4616xwtbj2di	04213 PEPSI COLA CL 33X24 VETRO VAP 0,33 CRT 24 21,00		BOX	\N	2025-11-25 14:55:41.916	2025-11-25 14:55:41.916	\N
ijbsw1kvz0dfkh0mzxj2ofl2	xxevpbrra70t4616xwtbj2di	04219 PEPSI COLA ZERO CL 33X24 VETR O VAP 0,33 CRT 24 21,00		BOX	\N	2025-11-25 14:55:42.551	2025-11-25 14:55:42.551	\N
k3ovse44fxb7oltwyzq2raei	xxevpbrra70t4616xwtbj2di	04228 SEVEN UP CL 33 X 24 VETRO VAP 0,33 CRT 24 21,00		BOX	\N	2025-11-25 14:55:43.185	2025-11-25 14:55:43.185	\N
ddlpcbacsxs9r9no4nmk1xp8	xxevpbrra70t4616xwtbj2di	04017 SPRITE CL 33 X 24 VETRO VAP 0,33 CRT 24 19,50		BOX	\N	2025-11-25 14:55:43.824	2025-11-25 14:55:43.824	\N
eflu1z0ng9expnqe7ojgo2ct	xxevpbrra70t4616xwtbj2di	04016 RED BULL LATT. ML. 250*24 0,25 CRT 24 27,75		L	\N	2025-11-25 14:55:44.465	2025-11-25 14:55:44.465	\N
g52ijl9sq9873gmz66r8b3l8	xxevpbrra70t4616xwtbj2di	04240 RED BULL ORGANICS GINGER BEER LATT. ML 250 X 24 0,25 CRT 24 25,05		L	\N	2025-11-25 14:55:45.101	2025-11-25 14:55:45.101	\N
qidfzegv9hpu1tvyhiklm9hw	xxevpbrra70t4616xwtbj2di	04194 RED BULL ORGANICS LEMON LATT. ML 250 X 24 0,25 CRT 24 25,05		L	\N	2025-11-25 14:55:45.73	2025-11-25 14:55:45.73	\N
uui23n78kxkfnvdl2nfcrvwz	xxevpbrra70t4616xwtbj2di	04193 RED BULL ORGANICS TONIC LATT. ML 250 X 24 0,25 CRT 24 25,05		L	\N	2025-11-25 14:55:46.364	2025-11-25 14:55:46.364	\N
pqoncqelpy3tzb61zh2sg3tx	xxevpbrra70t4616xwtbj2di	04303 TASSONI CEDRATA "ZERO" LATTINA  CL 25*12 0,25 CRT 12 9,53		BOX	\N	2025-11-25 14:55:47.002	2025-11-25 14:55:47.002	\N
l31kuofq1fouxda895pdk7m1	xxevpbrra70t4616xwtbj2di	04064 ARANC. AMARA  BARATTOLO S.PEL.  CL.33*24 0,33 CRT 24 13,05		BOX	\N	2025-11-25 14:55:47.639	2025-11-25 14:55:47.639	\N
ldd636r6sffllu3821u8flsy	xxevpbrra70t4616xwtbj2di	04054 CHINOTTO NERI BAR. CL.33*24 0,33 CRT 24 14,03		BOX	\N	2025-11-25 14:55:48.273	2025-11-25 14:55:48.273	\N
gmc1kb0rgvwb7fp178zx70ll	xxevpbrra70t4616xwtbj2di	04093 COCA COLA BAR. SLEEK CL. 33*24 0,33 CRT 24 15,15		BOX	\N	2025-11-25 14:55:48.91	2025-11-25 14:55:48.91	\N
kjxvinl4hbcx4udmdfwdoy2y	xxevpbrra70t4616xwtbj2di	04118 COCA COLA SENZA CAFF. SLEEK CL. 33*24 0,33 CRT 24 15,15		BOX	\N	2025-11-25 14:55:49.551	2025-11-25 14:55:49.551	\N
ljn2yl7by5dn02fyx96sm0xn	xxevpbrra70t4616xwtbj2di	04057 COCA COLA ZERO LATT. CL.33*24 0,33 CRT 24 15,15		BOX	\N	2025-11-25 14:55:50.183	2025-11-25 14:55:50.183	\N
vpko5vh7rgtyi1s2wutoxpfk	xxevpbrra70t4616xwtbj2di	04045 FANTA BAR. CL.33*24 0,33 CRT 24 15,15		BOX	\N	2025-11-25 14:55:50.815	2025-11-25 14:55:50.815	\N
empulo7wwktq0ufosc56y941	xxevpbrra70t4616xwtbj2di	04066 LEMONSODA LATTINA CL. 33*24 0,33 CRT 24 15,00		BOX	\N	2025-11-25 14:55:51.453	2025-11-25 14:55:51.453	\N
k7b7aju4bfmov5d7aus66hjl	xxevpbrra70t4616xwtbj2di	04212 MONSTER CLASSIC ML 500 X 24 0,50 CRT 24 36,75		L	\N	2025-11-25 14:55:52.09	2025-11-25 14:55:52.09	\N
fx5ijtywhtne0l9hj5uze1k7	xxevpbrra70t4616xwtbj2di	04217 MONSTER ENERGY ZERO ULT ML 500  X 24 0,50 CRT 24 36,75		L	\N	2025-11-25 14:55:52.725	2025-11-25 14:55:52.725	\N
psu1m67rs8andhg4oocfhx3a	xxevpbrra70t4616xwtbj2di	04215 MONSTER GREEN ZERO ML 500 X 24 0,50 CRT 24 36,75		L	\N	2025-11-25 14:55:53.489	2025-11-25 14:55:53.489	\N
z2fo8mzendws1b8vtt4n2xni	xxevpbrra70t4616xwtbj2di	04067 ORANSODA LATTINA CL. 33*24 0,33 CRT 24 15,00		BOX	\N	2025-11-25 14:55:54.119	2025-11-25 14:55:54.119	\N
zhadcg1a9vc93an7jnkbomz9	xxevpbrra70t4616xwtbj2di	04078 PEPSI COLA LATTINA CL33*24 0,33 CRT 24 12,75		BOX	\N	2025-11-25 14:55:54.76	2025-11-25 14:55:54.76	\N
m2six3un8w57txyxc2ti2l7e	xxevpbrra70t4616xwtbj2di	04040 SPRITE BAR.CL.33*24 0,33 CRT 24 15,15		BOX	\N	2025-11-25 14:55:55.397	2025-11-25 14:55:55.397	\N
h5ndiwvimhgj4u2w5iapzm2j	xxevpbrra70t4616xwtbj2di	04246 THE LIPTON LIMONE BAR CL33*24 0,33 CRT 24 17,48		BOX	\N	2025-11-25 14:55:56.028	2025-11-25 14:55:56.028	\N
xp2nb5zkv8dd9o34xtrb5kbf	xxevpbrra70t4616xwtbj2di	04247 THE LIPTON PESCA BAR CL33*24 0,33 CRT 24 17,48		BOX	\N	2025-11-25 14:55:56.662	2025-11-25 14:55:56.662	\N
xjibwvuyongv7r68dfl3428j	xxevpbrra70t4616xwtbj2di	04026 THE S.BENED. PESCA BAR CL33*24 0,33 CRT 24 12,00		BOX	\N	2025-11-25 14:55:57.293	2025-11-25 14:55:57.293	\N
i8yo01nnwtnuuf7bmckttdxh	xxevpbrra70t4616xwtbj2di	04027 THE S.BENED.LIMONE BAR CL33X24 0,33 CRT 24 12,00		BOX	\N	2025-11-25 14:55:57.933	2025-11-25 14:55:57.933	\N
uw1lb9syxgtungc75qhndbjw	xxevpbrra70t4616xwtbj2di	04081 CHINOTTO NERI PET CL.50*12 0,50 CRT 12 8,18		L	\N	2025-11-25 14:55:58.562	2025-11-25 14:55:58.562	\N
mm4ja4qocpb1e0sxagnqdol6	xxevpbrra70t4616xwtbj2di	04192 COCA COLA CL 45 X 24 PET 0,45 CRT 24 24,75		BOX	\N	2025-11-25 14:55:59.195	2025-11-25 14:55:59.195	\N
ish6b6roxoejqr0vgdnjve4z	xxevpbrra70t4616xwtbj2di	04189 COCA COLA ZERO PET LT.0.45*12 0,45 CRT 12 12,38		BOX	\N	2025-11-25 14:55:59.835	2025-11-25 14:55:59.835	\N
k8kfk6yuf0g2ahdmhzcy4nu7	xxevpbrra70t4616xwtbj2di	04214 FANTA LIMONATA ZERO PET LT.0.4 5*12 0,45 CRT 12 12,38		BOX	\N	2025-11-25 14:56:00.469	2025-11-25 14:56:00.469	\N
sklsq1n2hunj38d7bjxfg4gs	xxevpbrra70t4616xwtbj2di	04191 FANTA PET LT.0.45*12 0,45 CRT 12 12,38		BOX	\N	2025-11-25 14:56:01.101	2025-11-25 14:56:01.101	\N
etnhzgjvx3rpp8w50zdip89p	xxevpbrra70t4616xwtbj2di	04279 POWERADE ACTIVE ZERO LEM CL  50*12 0,50 CRT 12 11,48		L	\N	2025-11-25 14:56:01.739	2025-11-25 14:56:01.739	\N
cbbiqwvxo8c5gno9h4qbayvr	xxevpbrra70t4616xwtbj2di	04053 POWERADE ARANCIA  PET CL.50*12 0,50 CRT 12 11,48		L	\N	2025-11-25 14:56:02.372	2025-11-25 14:56:02.372	\N
ndkz2g5qu0inkwckbquaghiz	xxevpbrra70t4616xwtbj2di	04051 POWERADE ARANCIA ROSSA PET LT.0,50*12 0,50 CRT 12 11,48		L	\N	2025-11-25 14:56:03.016	2025-11-25 14:56:03.016	\N
nadwznmocw9kkqqckfz0m74i	xxevpbrra70t4616xwtbj2di	04050 POWERADE BLU FRUT. BOSCO PET CL.50*12 0,50 CRT 12 11,48		L	\N	2025-11-25 14:56:03.65	2025-11-25 14:56:03.65	\N
mpsqiz3b9qztv40of7vmsri6	xxevpbrra70t4616xwtbj2di	04117 POWERADE LIMONE PET CL.50*12 0,50 CRT 12 11,48		L	\N	2025-11-25 14:56:04.285	2025-11-25 14:56:04.285	\N
b3o59ew3o42epqix4eu6vwjb	xxevpbrra70t4616xwtbj2di	04190 SPRITE PET LT.0.45*12 0,45 CRT 12 12,38		BOX	\N	2025-11-25 14:56:04.92	2025-11-25 14:56:04.92	\N
bkp846h7tqlnd5w1k5rxg0ov	xxevpbrra70t4616xwtbj2di	04176 THE FUZE LIMONE CL 40*12 0,40 CRT 12 10,43		BOX	\N	2025-11-25 14:56:05.553	2025-11-25 14:56:05.553	\N
l62owxkzeg3b473k1h93sd3h	xxevpbrra70t4616xwtbj2di	04177 THE FUZE MANGO/CAMOMILLA CL 40 X12 0,40 CRT 12 10,43		BOX	\N	2025-11-25 14:56:06.187	2025-11-25 14:56:06.187	\N
doik6p5zwi3u19py3usigevg	xxevpbrra70t4616xwtbj2di	04175 THE FUZE PESCA CL 40*12 0,40 CRT 12 10,43		BOX	\N	2025-11-25 14:56:06.821	2025-11-25 14:56:06.821	\N
nuf5v2apf5d684pu6g2cex0m	xxevpbrra70t4616xwtbj2di	04024 THE S. BENED. LIMONE PET LT.0.50 *12 0,50 CRT 12 5,10		L	\N	2025-11-25 14:56:07.46	2025-11-25 14:56:07.46	\N
u1nkvquljlt97n2mqvy7urd5	xxevpbrra70t4616xwtbj2di	04025 THE S. BENED. PESCA PET LT.0.50 *12 0,50 CRT 12 5,10		L	\N	2025-11-25 14:56:08.097	2025-11-25 14:56:08.097	\N
j6ua2mp70f7d1vuhka3p8fce	xxevpbrra70t4616xwtbj2di	04049 THE S. BENED. VERDE  PET CL.50*12 0,50 CRT 12 6,00		L	\N	2025-11-25 14:56:08.808	2025-11-25 14:56:08.808	\N
v1mmohnpewo634n1fvptgbga	xxevpbrra70t4616xwtbj2di	04235 COCA COLA PET LT 1 X 6 1,00 CRT 6 9,30		BOX	\N	2025-11-25 14:56:09.438	2025-11-25 14:56:09.438	\N
df3epfchgjl79lwerafkjhuk	xxevpbrra70t4616xwtbj2di	04056 COCA COLA V.A.R. LT.1*12 1,00 CES 12 18,15		PIECE	\N	2025-11-25 14:56:10.08	2025-11-25 14:56:10.08	\N
m4co299iwex7ee4l2903kek4	xxevpbrra70t4616xwtbj2di	04092 FANTA VAR LT. 1*12 1,00 CES 12 18,15		PIECE	\N	2025-11-25 14:56:10.712	2025-11-25 14:56:10.712	\N
ar869ldeu6tmlupvouk7utpb	xxevpbrra70t4616xwtbj2di	04059 SCHWEPPES LITRO*6 LIMONE PET 1,00 CRT 6 7,65		BOX	\N	2025-11-25 14:56:11.346	2025-11-25 14:56:11.346	\N
jww4x3ixlhvj4rh7g994lmeh	xxevpbrra70t4616xwtbj2di	04225 SCHWEPPES LITRO*6 POMPELMO ROS A PET 1,00 CRT 6 7,65		BOX	\N	2025-11-25 14:56:11.98	2025-11-25 14:56:11.98	\N
jubakti1c9iqh3i2j3kjdw8l	xxevpbrra70t4616xwtbj2di	04060 SCHWEPPES LITRO*6 TONICA 1,00 CRT 6 7,65		BOX	\N	2025-11-25 14:56:12.616	2025-11-25 14:56:12.616	\N
ewvvy1zocqudgsteew582fxy	xxevpbrra70t4616xwtbj2di	04000 COCA COLA PET LT.1.5 *6 1,50 CRT 6 11,93		L	\N	2025-11-25 14:56:13.248	2025-11-25 14:56:13.248	\N
jkmj2c4w7ivsplmucfi3ue2v	xxevpbrra70t4616xwtbj2di	04055 COCA COLA ZERO LT.1.5*6 1,50 CRT 6 12,00		L	\N	2025-11-25 14:56:13.882	2025-11-25 14:56:13.882	\N
rr02e28ua180b0oqjctzzn2g	xxevpbrra70t4616xwtbj2di	04030 FANTA PET LT. 1.5*6 1,50 CRT 6 9,75		L	\N	2025-11-25 14:56:14.521	2025-11-25 14:56:14.521	\N
w98hdju6krw4zq6xe96rchit	xxevpbrra70t4616xwtbj2di	04096 SIFONE MY SODA SAN BENEDETTO LT 1.5 1,50 BOT 1 4,65		L	\N	2025-11-25 14:56:15.17	2025-11-25 14:56:15.17	\N
iz40zi8wcnmzzbx4efyostd7	xxevpbrra70t4616xwtbj2di	04037 SPRITE PET LT. 1.5*6 1,50 CRT 6 9,75		L	\N	2025-11-25 14:56:15.806	2025-11-25 14:56:15.806	\N
eaynxodx6puamop3ujv87dhh	xxevpbrra70t4616xwtbj2di	04034 THE S. BENED. LIMONE PET LT.1.5*6 1,50 CRT 6 5,10		L	\N	2025-11-25 14:56:16.44	2025-11-25 14:56:16.44	\N
xbjb3ciktmtyhypr08npkqv4	xxevpbrra70t4616xwtbj2di	04035 THE S. BENED. PESCA PET LT.1.5*6 1,50 CRT 6 5,10		L	\N	2025-11-25 14:56:17.076	2025-11-25 14:56:17.076	\N
xtexehgnx36pq03goxyhfujc	xxevpbrra70t4616xwtbj2di	04065 FUSTO COCA COLA LT. 18 18,00 FUS 1 38,25		PIECE	\N	2025-11-25 14:56:17.707	2025-11-25 14:56:17.707	\N
j7fa42x0a6v0258tsxdvt9xw	xxevpbrra70t4616xwtbj2di	04023 FUSTO FANTA PREMIX LT 18 18,00 FUS 1 38,25		PIECE	\N	2025-11-25 14:56:18.341	2025-11-25 14:56:18.341	\N
uyfunahqkdp3fcbgg41oh5sz	xxevpbrra70t4616xwtbj2di	04099 FUSTO POST MIX PEPSI COLA LT 18 18,00 FUS 1 186,00		PIECE	\N	2025-11-25 14:56:18.977	2025-11-25 14:56:18.977	\N
zu7xnjb1iqb9o50qv1ac1llv	xxevpbrra70t4616xwtbj2di	04112 FUSTO POSTMIX SCHW LIMONE LT. 18 18,00 FUS 1 190,50		L	\N	2025-11-25 14:56:19.613	2025-11-25 14:56:19.613	\N
yqpli3flw1ugc2pj95r5dmc4	xxevpbrra70t4616xwtbj2di	04110 FUSTO POSTMIX SCHW TONICA  LT.  18 18,00 FUS 1 190,50		L	\N	2025-11-25 14:56:20.251	2025-11-25 14:56:20.251	\N
f5bkfdxjmjdkna2jinddj23o	xxevpbrra70t4616xwtbj2di	04106 FUSTO PRE MIX SCHW. LIMONE LT.  18 18,00 FUS 1 30,00		PIECE	\N	2025-11-25 14:56:20.879	2025-11-25 14:56:20.879	\N
uz14dt36gcm95ehub3lygnz0	xxevpbrra70t4616xwtbj2di	04114 FUSTO PREMIX PEPSI LT. 18 18,00 FUS 1 29,25		PIECE	\N	2025-11-25 14:56:21.519	2025-11-25 14:56:21.519	\N
ipr5qj9smrxiz7yjmpsjbzm0	xxevpbrra70t4616xwtbj2di	04086 FUSTO PREMIX SCHW. TON. LT18 18,00 FUS 1 30,00		PIECE	\N	2025-11-25 14:56:22.159	2025-11-25 14:56:22.159	\N
v46txgyym4f2kyrvzohf7uta	xxevpbrra70t4616xwtbj2di	04125 PEPSI POSTMIX BAG IN BOX LT 5 5,00 CRT 1 53,25		PIECE	\N	2025-11-25 14:56:22.791	2025-11-25 14:56:22.791	\N
ao9duvicyxu5qrssokvjy601	xxevpbrra70t4616xwtbj2di	04223 SCHW LIMONE POSTMIX BAG IN BO  X LT 5 5,00 CRT 1 53,25		PIECE	\N	2025-11-25 14:56:23.421	2025-11-25 14:56:23.421	\N
kw7nsbnbxzdecsjgguvmcht6	xxevpbrra70t4616xwtbj2di	04224 SCHW TONICA POSTMIX BAG IN BO  X LT 5 5,00 CRT 1 53,25		PIECE	\N	2025-11-25 14:56:24.131	2025-11-25 14:56:24.131	\N
qzo8is9k6igtgkk4io923na4	xxevpbrra70t4616xwtbj2di	07453 FUSTO BIRRA FRANZ. HELL  LT12   POLIKEG 12,00 FUS 1 36,00		PIECE	\N	2025-11-25 14:56:24.762	2025-11-25 14:56:24.762	\N
lj8sov32bsnlm738lx53jci6	xxevpbrra70t4616xwtbj2di	07107 FUSTO BIRRA HELLER BOCK CHIARA DM LT 15 15,00 FUS 1 52,43		PIECE	\N	2025-11-25 14:56:25.417	2025-11-25 14:56:25.417	\N
mdq9csx5e2jbvs1fp1mv4b9n	xxevpbrra70t4616xwtbj2di	07455 FUSTO BIRRA LEFFE BLONDE  LT12   POLIKEG 12,00 FUS 1 59,25		PIECE	\N	2025-11-25 14:56:26.056	2025-11-25 14:56:26.056	\N
vx9sj1ahuc4m48hmhpouvgot	xxevpbrra70t4616xwtbj2di	07452 FUSTO BIRRA LEFFE ROUGE  LT12   POLIKEG 12,00 FUS 1 57,75		PIECE	\N	2025-11-25 14:56:26.695	2025-11-25 14:56:26.695	\N
h97n2nisjdycylsk8aprhmkh	xxevpbrra70t4616xwtbj2di	07115 FUSTO BIRRA MENABREA AMBRATA LT 15 15,00 FUS 1 51,75		PIECE	\N	2025-11-25 14:56:27.328	2025-11-25 14:56:27.328	\N
pzbpr3hcwjksddrnbdtmsulm	xxevpbrra70t4616xwtbj2di	07023 FUSTO BIRRA MENABREA BIONDA LT.15 15,00 FUS 1 41,25		PIECE	\N	2025-11-25 14:56:27.957	2025-11-25 14:56:27.957	\N
x4xenqffwop21hszoz52s4tl	xxevpbrra70t4616xwtbj2di	07117 FUSTO BIRRA MENABREA ROSSA 7.5  D.M. LT 15 15,00 FUS 1 66,00		PIECE	\N	2025-11-25 14:56:28.59	2025-11-25 14:56:28.59	\N
m3he4r0teocvq71ydxt7zwua	xxevpbrra70t4616xwtbj2di	07055 FUSTO BIRRA MENABREA STRONG D.M. 15 LT 15,00 FUS 1 60,00		PIECE	\N	2025-11-25 14:56:29.22	2025-11-25 14:56:29.22	\N
j1nl4nju1llgstgu4l1rjaqq	xxevpbrra70t4616xwtbj2di	07140 FUSTO BIRRA P. G.RISERVA RED LT 16 16,00 FUS 1 65,70		PIECE	\N	2025-11-25 14:56:29.864	2025-11-25 14:56:29.864	\N
ghufgqz5a9j6xwqkgljiv45f	xxevpbrra70t4616xwtbj2di	07154 FUSTO BIRRA P.G.RISERVA BIANCA  WEISS LT 16 16,00 FUS 1 67,50		PIECE	\N	2025-11-25 14:56:30.493	2025-11-25 14:56:30.493	\N
fzurglnnke5e54b1i437q5nh	xxevpbrra70t4616xwtbj2di	07093 FUSTO BIRRA RAFFO GREZZA PET LT 20 20,00 FUS 1 68,25		PIECE	\N	2025-11-25 14:56:31.139	2025-11-25 14:56:31.139	\N
ulavm7vqrxnut6s6a8dghbzg	xxevpbrra70t4616xwtbj2di	07017 FUSTO BIRRA S.BENOIT BLANCHE LT 16 16,00 FUS 1 68,40		PIECE	\N	2025-11-25 14:56:31.771	2025-11-25 14:56:31.771	\N
rqwqldh46otu3ook5ybdwubz	xxevpbrra70t4616xwtbj2di	07097 FUSTO BIRRA SIXTUS LT 15 15,00 FUS 1 52,50		PIECE	\N	2025-11-25 14:56:32.409	2025-11-25 14:56:32.409	\N
rbptf091px4pvb2kd68r83jd	xxevpbrra70t4616xwtbj2di	07443 FUSTO BIRRA STELLA ARTOIS LT12   POLIKEG 12,00 FUS 1 33,38		PIECE	\N	2025-11-25 14:56:33.041	2025-11-25 14:56:33.041	\N
yntctrxdj2shawz2rk7vrk80	xxevpbrra70t4616xwtbj2di	07393 FUSTO BIRRA BASS SCOTCH LT 30 30,00 FUS 1 123,75		PIECE	\N	2025-11-25 14:56:33.677	2025-11-25 14:56:33.677	\N
z8o6ye2js13csm9oqt8nk929	xxevpbrra70t4616xwtbj2di	07402 FUSTO BIRRA CORONA LT 30 30,00 FUS 1 90,00		PIECE	\N	2025-11-25 14:56:34.313	2025-11-25 14:56:34.313	\N
zzzmldtvqfxn5do9zi9xdphw	xxevpbrra70t4616xwtbj2di	07319 FUSTO BIRRA FORST CADUTA KRONE N LT 30 30,00 FUS 1 97,50		PIECE	\N	2025-11-25 14:56:34.947	2025-11-25 14:56:34.947	\N
izvhuk5j8s3r6lv3vh56wz2m	xxevpbrra70t4616xwtbj2di	07101 FUSTO BIRRA FORST KRONEN SPEC. LT.30 30,00 FUS 1 81,00		PIECE	\N	2025-11-25 14:56:35.584	2025-11-25 14:56:35.584	\N
o0y4zt5pbmqr5d5bk2g6prff	xxevpbrra70t4616xwtbj2di	07328 FUSTO BIRRA FRANZISK HEFE WEIS S LT 30 30,00 FUS 1 92,25		PIECE	\N	2025-11-25 14:56:36.218	2025-11-25 14:56:36.218	\N
i828kn9h67x5vz1nsk2qvnro	xxevpbrra70t4616xwtbj2di	07142 FUSTO BIRRA FULLER IPA LT 30 30,00 FUS 1 153,75		PIECE	\N	2025-11-25 14:56:36.855	2025-11-25 14:56:36.855	\N
bx89n9qi0t47pehsxuga8h99	xxevpbrra70t4616xwtbj2di	07329 FUSTO BIRRA LOWENBRAU ORIGINAL LT 30 30,00 FUS 1 84,75		PIECE	\N	2025-11-25 14:56:37.486	2025-11-25 14:56:37.486	\N
slyygis4b9yvvj6evjzzmpu2	xxevpbrra70t4616xwtbj2di	07330 FUSTO BIRRA LOWENBRAU PILS LT 30 30,00 FUS 1 88,50		PIECE	\N	2025-11-25 14:56:38.123	2025-11-25 14:56:38.123	\N
p5jisg7a90z2qiafhl5raovz	xxevpbrra70t4616xwtbj2di	07331 FUSTO BIRRA LOWENBRAU URTYP LT 30 30,00 FUS 1 82,50		PIECE	\N	2025-11-25 14:56:38.762	2025-11-25 14:56:38.762	\N
khrc7jjagwnrz50uimpf52wt	xxevpbrra70t4616xwtbj2di	07104 FUSTO BIRRA MENABREA  BIONDA LT.30 30,00 FUS 1 81,00		PIECE	\N	2025-11-25 14:56:39.471	2025-11-25 14:56:39.471	\N
v6xysoh1lc4edact92u7sbjo	xxevpbrra70t4616xwtbj2di	07418 FUSTO BIRRA NASTRO AZZURRO LT 30 30,00 FUS 1 73,50		PIECE	\N	2025-11-25 14:56:40.102	2025-11-25 14:56:40.102	\N
yhti670egdvx939eus4nf7c0	xxevpbrra70t4616xwtbj2di	07063 FUSTO BIRRA RAFFO ORIGINAL LT 30 30,00 FUS 1 75,75		PIECE	\N	2025-11-25 14:56:40.745	2025-11-25 14:56:40.745	\N
a0xii9yo5w3mif4ti11gde48	xxevpbrra70t4616xwtbj2di	07398 FUSTO BIRRA STELLA ARTOIS LT30 30,00 FUS 1 81,00		PIECE	\N	2025-11-25 14:56:41.379	2025-11-25 14:56:41.379	\N
vae8mf6rfhbwihc1dvljyenw	xxevpbrra70t4616xwtbj2di	07250 FUSTO BIRRA TENNENT'S LT.30 30,00 FUS 1 124,50		PIECE	\N	2025-11-25 14:56:42.016	2025-11-25 14:56:42.016	\N
s8afijvewrtciwe8y0i1u6zm	xxevpbrra70t4616xwtbj2di	07471 BIRRA ALHAMBRA "ROJA" S.MIGUEL CL 33 X 24 0,33 CRT 24 45,75		BOX	\N	2025-11-25 14:56:42.65	2025-11-25 14:56:42.65	\N
k0zjxxstd2ebcecgxi40dnwc	xxevpbrra70t4616xwtbj2di	07344 BIRRA ALHAMBRA 1925 S.MIGUEL CL 33 X 24 0,33 CRT 24 37,50		BOX	\N	2025-11-25 14:56:43.284	2025-11-25 14:56:43.284	\N
tejhb7nh2gj5g3968gvvqsy3	xxevpbrra70t4616xwtbj2di	07068 BIRRA ASAHI  CL.33 *24 0,33 CRT 24 37,35		BOX	\N	2025-11-25 14:56:43.92	2025-11-25 14:56:43.92	\N
n4vc7js5ah4c3j2i1id7givp	xxevpbrra70t4616xwtbj2di	07079 BIRRA BECK'S  CL. 33* 24 0,33 CRT 24 21,38		BOX	\N	2025-11-25 14:56:44.555	2025-11-25 14:56:44.555	\N
onldg2o2v3gc0odtnbg1qbn5	xxevpbrra70t4616xwtbj2di	07135 BIRRA BECK'S ANALCOLICA CL.33*24 0,33 CRT 24 22,20		BOX	\N	2025-11-25 14:56:45.19	2025-11-25 14:56:45.19	\N
op6ibjzmdkh0x83ak0ogxsw9	xxevpbrra70t4616xwtbj2di	07181 BIRRA BJORNE 33*24 0,33 CRT 24 30,45		BOX	\N	2025-11-25 14:56:45.831	2025-11-25 14:56:45.831	\N
m0mo4xugg5ii49dgrhvxbk0j	xxevpbrra70t4616xwtbj2di	07007 BIRRA BUD  CL. 33*24 0,33 CRT 24 25,35		BOX	\N	2025-11-25 14:56:46.46	2025-11-25 14:56:46.46	\N
af9ahfijkk3x2c2qy02uviqe	xxevpbrra70t4616xwtbj2di	07001 BIRRA CERES STRONG CL.33*24 BT 0,33 CRT 24 37,13		PIECE	\N	2025-11-25 14:56:47.094	2025-11-25 14:56:47.094	\N
wiac9ofsmnospqu5xnf9ujbw	xxevpbrra70t4616xwtbj2di	07368 BIRRA CORONA CERO 0.0 CL.33*24 0,33 CRT 24 32,63		BOX	\N	2025-11-25 14:56:47.728	2025-11-25 14:56:47.728	\N
vsdxqclu9e9gpb7xu5nm8sfv	xxevpbrra70t4616xwtbj2di	07367 BIRRA CORONA EXTRA CL.33*24 0,33 CRT 24 29,85		BOX	\N	2025-11-25 14:56:48.361	2025-11-25 14:56:48.361	\N
ri6ofassu9hs1lyeu6ci695m	xxevpbrra70t4616xwtbj2di	07089 BIRRA DESPERADOS CL.33*24 0,33 CRT 24 33,38		BOX	\N	2025-11-25 14:56:48.993	2025-11-25 14:56:48.993	\N
g77ye7fl4ty6xr83enocetw4	xxevpbrra70t4616xwtbj2di	07430 BIRRA DU DEMON CL.33*12 0,33 CRT 12 30,30		BOX	\N	2025-11-25 14:56:49.624	2025-11-25 14:56:49.624	\N
kd4lik7364sq6jovpzjv1olu	xxevpbrra70t4616xwtbj2di	07054 BIRRA FAXE CL 33 * 24 0,33 CRT 24 25,13		BOX	\N	2025-11-25 14:56:50.258	2025-11-25 14:56:50.258	\N
n1p3abplkn6ymyyvu2iqz3ua	xxevpbrra70t4616xwtbj2di	07092 BIRRA GUINNES DRAUGHT CL.33*24  BT 0,33 CRT 24 47,10		BOX	\N	2025-11-25 14:56:50.889	2025-11-25 14:56:50.889	\N
g9ha6ym6mm1qypio148qncve	xxevpbrra70t4616xwtbj2di	07401 BIRRA HEINEKEN  0.0  CL 33*24 0,33 CRT 24 24,00		BOX	\N	2025-11-25 14:56:51.522	2025-11-25 14:56:51.522	\N
cpkihefn8jnyftvgahlsadyk	xxevpbrra70t4616xwtbj2di	07004 BIRRA HEINEKEN  CL.33*24 0,33 CRT 24 24,00		BOX	\N	2025-11-25 14:56:52.152	2025-11-25 14:56:52.152	\N
j99xer2i2175zlcm6dl871bh	xxevpbrra70t4616xwtbj2di	07105 BIRRA ICHNUSA CL.33*24 0,33 CRT 24 24,00		BOX	\N	2025-11-25 14:56:52.784	2025-11-25 14:56:52.784	\N
lw0xriy9xjehxcokngmdgl7l	xxevpbrra70t4616xwtbj2di	07320 BIRRA ICHNUSA NON FILTRATA CL 33*24 0,33 CRT 24 27,00		BOX	\N	2025-11-25 14:56:53.418	2025-11-25 14:56:53.418	\N
zqkw5o3glnupknckuk32qm6d	xxevpbrra70t4616xwtbj2di	07086 BIRRA MENABREA BIONDA CL 33*24 0,33 CRT 24 27,00		BOX	\N	2025-11-25 14:56:54.054	2025-11-25 14:56:54.054	\N
mb5k8ahnok94gpgice8sugyk	xxevpbrra70t4616xwtbj2di	07299 BIRRA MENABREA DM ROSSA CL 33 X 24 0,33 CRT 24 34,95		BOX	\N	2025-11-25 14:56:54.756	2025-11-25 14:56:54.756	\N
tk9qq5f3g364ez2r6r4i6gvl	xxevpbrra70t4616xwtbj2di	07403 BIRRA MENABREA NON FILTRATA CL   33*24 0,33 CRT 24 30,75		L	\N	2025-11-25 14:56:55.391	2025-11-25 14:56:55.391	\N
bwv5j4c5v2gouurh19boyvsx	xxevpbrra70t4616xwtbj2di	07365 BIRRA MENABREA+GAZZOSA panache  CL 27,5 X 12 0,28 CRT 12 14,25		BOX	\N	2025-11-25 14:56:56.025	2025-11-25 14:56:56.025	\N
l5c6rflx0d18ysdag0vv90q7	xxevpbrra70t4616xwtbj2di	07391 BIRRA MESSINA CRISTALLI SALE C  L.33*24 0,33 CRT 24 31,88		BOX	\N	2025-11-25 14:56:56.668	2025-11-25 14:56:56.668	\N
lzngvtga4xv3cubzuz80lon1	xxevpbrra70t4616xwtbj2di	07087 BIRRA MORETTI CL.33*24 0,33 CRT 24 20,10		BOX	\N	2025-11-25 14:56:57.301	2025-11-25 14:56:57.301	\N
b1fnu2oecikqe6md3vur5hoq	xxevpbrra70t4616xwtbj2di	07423 BIRRA N. AZZ."CAPRI" CL33 X 24 0,33 CRT 24 26,63		BOX	\N	2025-11-25 14:56:57.932	2025-11-25 14:56:57.932	\N
hbijs2wxa61f8vzs5fjektxy	xxevpbrra70t4616xwtbj2di	07422 BIRRA NASTRO AZZURRO ZERO CL33  X12 0,33 CRT 12 11,63		BOX	\N	2025-11-25 14:56:58.567	2025-11-25 14:56:58.567	\N
zte700vh2js7vw3rsodcse21	xxevpbrra70t4616xwtbj2di	07083 BIRRA P.NASTRO AZZURRO CL 33*2 4 0,33 CRT 24 21,75		BOX	\N	2025-11-25 14:56:59.199	2025-11-25 14:56:59.199	\N
pgb6vshz3fe009awvcz50nhf	xxevpbrra70t4616xwtbj2di	07003 BIRRA PERONI  CL.33 *24 0,33 CRT 24 19,65		BOX	\N	2025-11-25 14:56:59.834	2025-11-25 14:56:59.834	\N
jtz52732p74iomwtmcbq3vmt	xxevpbrra70t4616xwtbj2di	07355 BIRRA PERONI G.RISERVA "D.M." CL33X24 0,33 CRT 24 27,15		BOX	\N	2025-11-25 14:57:00.473	2025-11-25 14:57:00.473	\N
nsjxt4e9ubqe76d42tyn942n	xxevpbrra70t4616xwtbj2di	07358 BIRRA PERONI G.RISERVA BIANCA  CL33X24 0,33 CRT 24 27,15		BOX	\N	2025-11-25 14:57:01.11	2025-11-25 14:57:01.11	\N
q33dlezk3jmugglctfhse1vq	xxevpbrra70t4616xwtbj2di	07356 BIRRA PERONI G.RISERVA ROSSA CL33X24 0,33 CRT 24 27,15		BOX	\N	2025-11-25 14:57:01.755	2025-11-25 14:57:01.755	\N
n7u04jr75lxw6tkt0zgjyqf4	xxevpbrra70t4616xwtbj2di	07025 BIRRA PERONI LEMON CHILL CL33*24 0,33 CRT 24 20,10		BOX	\N	2025-11-25 14:57:02.383	2025-11-25 14:57:02.383	\N
ceu6gu1hy35mwn1gic84fhmc	xxevpbrra70t4616xwtbj2di	07326 BIRRA PERONI SENZA GLUTINE CL 33*24 0,33 CRT 24 33,00		BOX	\N	2025-11-25 14:57:03.018	2025-11-25 14:57:03.018	\N
s92fx01yr1bromlzfqxt4cpc	xxevpbrra70t4616xwtbj2di	07424 BIRRA RAFFO GREZZA CL33 X 24 0,33 CRT 24 24,75		PIECE	\N	2025-11-25 14:57:03.649	2025-11-25 14:57:03.649	\N
nqal3dngv5iveq5e8c15powk	xxevpbrra70t4616xwtbj2di	07433 BIRRA RAFFO ORIGINAL CL33 X 24 0,33 CRT 24 20,25		BOX	\N	2025-11-25 14:57:04.291	2025-11-25 14:57:04.291	\N
sdn4bupxyp2mtb92cdlztfw5	xxevpbrra70t4616xwtbj2di	07472 BIRRA S.MIGUEL ESPECIAL CL 33 X 24 0,33 CRT 24 25,50		BOX	\N	2025-11-25 14:57:04.925	2025-11-25 14:57:04.925	\N
iqcg0co22oho01gbwgm4lqdh	xxevpbrra70t4616xwtbj2di	07255 BIRRA STELLA ARTOIS CL 33X24 0,33 CRT 24 25,50		BOX	\N	2025-11-25 14:57:05.558	2025-11-25 14:57:05.558	\N
khw9drngc90klegiacrhawb8	xxevpbrra70t4616xwtbj2di	07077 BIRRA TENNENT'S SUP. CL.33*24 0,33 CRT 24 37,35		BOX	\N	2025-11-25 14:57:06.191	2025-11-25 14:57:06.191	\N
u1pxfmy32xpl8tj10x41fbig	xxevpbrra70t4616xwtbj2di	07082 BIRRA PERONI  BARATTOLO CL.33*24 0,33 CRT 24 20,25		BOX	\N	2025-11-25 14:57:06.822	2025-11-25 14:57:06.822	\N
ppb49sxtoirbsdgrd67uum6x	xxevpbrra70t4616xwtbj2di	07332 BIRRA FRANZISK HEFE WEISS CL50 X20 0,50 CRT 20 32,25		L	\N	2025-11-25 14:57:07.452	2025-11-25 14:57:07.452	\N
s47zetx7yvrzdu5q7rekpdg2	xxevpbrra70t4616xwtbj2di	07382 BIRRA ICHNUSA NON FILTRATA CL  50*15 0,50 CRT 15 22,50		L	\N	2025-11-25 14:57:08.093	2025-11-25 14:57:08.093	\N
w3ry9ee5phoq3n5sb8xkexkk	xxevpbrra70t4616xwtbj2di	07080 BIRRA HEINEKEN  CL.66*15 0,66 CRT 15 22,20		BOX	\N	2025-11-25 14:57:08.726	2025-11-25 14:57:08.726	\N
q4ne889xt4o3re11k93b4iqd	xxevpbrra70t4616xwtbj2di	07106 BIRRA ICHNUSA CL. 66*15 0,66 CRT 15 24,75		BOX	\N	2025-11-25 14:57:09.358	2025-11-25 14:57:09.358	\N
ptz96psegb666se5nq3yc2ns	xxevpbrra70t4616xwtbj2di	07085 BIRRA MENABREA BIONDA CL 66*15 0,66 CRT 15 27,00		BOX	\N	2025-11-25 14:57:10.057	2025-11-25 14:57:10.057	\N
oqmep5ej2186ocyik10gwzxd	xxevpbrra70t4616xwtbj2di	07084 BIRRA MORETTI CL.66*15 0,66 CRT 15 18,45		BOX	\N	2025-11-25 14:57:10.691	2025-11-25 14:57:10.691	\N
x75ebenn05zy1isag96minam	xxevpbrra70t4616xwtbj2di	07454 BIRRA NASTRO AZZURRO CL. 62 *12 0,62 CRT 12 15,75		BOX	\N	2025-11-25 14:57:11.329	2025-11-25 14:57:11.329	\N
kk9nqidggalj0uhx39g5zc0o	xxevpbrra70t4616xwtbj2di	07081 BIRRA PERONI  CL.66*15 0,66 CRT 15 17,78		BOX	\N	2025-11-25 14:57:12.2	2025-11-25 14:57:12.2	\N
thc1o32qg9asff0pe9trlu92	xxevpbrra70t4616xwtbj2di	07444 BIRRA GRANDA GIRL KLOE LAGER BT CL33X12 0,33 CRT 12 19,65		PIECE	\N	2025-11-25 14:57:12.834	2025-11-25 14:57:12.834	\N
aap49r4bchjjiwig26utt7re	xxevpbrra70t4616xwtbj2di	07164 BIRRA GRANDA XTRA 2.0 IPA CL33X12 0,33 CRT 12 24,38		PIECE	\N	2025-11-25 14:57:13.468	2025-11-25 14:57:13.468	\N
ofqca1uwb2gy667m2zz0y662	xxevpbrra70t4616xwtbj2di	07457 BIRRA MALEDETTA CL 33 X 12 0,33 CRT 12 28,13		BOX	\N	2025-11-25 14:57:14.102	2025-11-25 14:57:14.102	\N
ybzxh4e73gn5p5apxfozlmy9	xxevpbrra70t4616xwtbj2di	07156 BIRRA BLANCHE DE NAMUR CL. 33*24 0,33 CRT 24 36,98		BOX	\N	2025-11-25 14:57:14.74	2025-11-25 14:57:14.74	\N
yuqnnuhcjszxi8uuy9vdgd5t	xxevpbrra70t4616xwtbj2di	07127 BIRRA BLOEMENBIER CL.33*24 0,33 CRT 24 54,15		BOX	\N	2025-11-25 14:57:15.373	2025-11-25 14:57:15.373	\N
h3hh58ehkc0szomgvroz4eg0	xxevpbrra70t4616xwtbj2di	07400 BIRRA BORGO DUCHESSA CL 33X12 0,33 CRT 12 29,25		BOX	\N	2025-11-25 14:57:16.002	2025-11-25 14:57:16.002	\N
ii1z875irp91w1ae0e7jjv8f	xxevpbrra70t4616xwtbj2di	07395 BIRRA BORGO LISA CL 33 X 12 0,33 CRT 12 14,70		BOX	\N	2025-11-25 14:57:16.66	2025-11-25 14:57:16.66	\N
zak0w9yqzv10y6mrxa59ly6h	xxevpbrra70t4616xwtbj2di	07396 BIRRA BORGO MY ANTONIA CL33X12 0,33 CRT 12 29,25		BOX	\N	2025-11-25 14:57:17.296	2025-11-25 14:57:17.296	\N
kvecvecfmxes807duuheftk4	xxevpbrra70t4616xwtbj2di	07404 BIRRA BORGO REALE "EXTRA" CL  33X12 0,33 CRT 12 29,70		BOX	\N	2025-11-25 14:57:17.935	2025-11-25 14:57:17.935	\N
d75w47cpolr1uj88wrrcg8yx	xxevpbrra70t4616xwtbj2di	07397 BIRRA BORGO REALE IPA CL 33X12 0,33 CRT 12 29,25		BOX	\N	2025-11-25 14:57:18.582	2025-11-25 14:57:18.582	\N
nfix2rrwtw1fbkflcve4gowg	xxevpbrra70t4616xwtbj2di	07184 BIRRA BOUCAN.GOLDEN ALE 33*24 0,33 CRT 24 59,63		BOX	\N	2025-11-25 14:57:19.219	2025-11-25 14:57:19.219	\N
fyr271qbw9rrfs5kbaxo3dfj	xxevpbrra70t4616xwtbj2di	07411 BIRRA BREWDOG PUNK IPA CL33X12 0,33 CRT 12 31,95		PIECE	\N	2025-11-25 14:57:19.849	2025-11-25 14:57:19.849	\N
azhz6p5lk16wkmd6kolpkvhk	xxevpbrra70t4616xwtbj2di	07100 BIRRA DAURA DAMM GLUTENFREE  CL 33*24 0,33 CRT 24 39,15		BOX	\N	2025-11-25 14:57:20.479	2025-11-25 14:57:20.479	\N
rvr51yx1b11iiw7obbscjnf3	xxevpbrra70t4616xwtbj2di	07111 BIRRA GULDEN DRAAK CL. 33*24 0,33 CRT 24 54,00		BOX	\N	2025-11-25 14:57:21.113	2025-11-25 14:57:21.113	\N
s9b8ox9nopmj27tjil7ocuwv	xxevpbrra70t4616xwtbj2di	07126 BIRRA KWAK CL. 33*24 0,33 CRT 24 57,60		BOX	\N	2025-11-25 14:57:21.749	2025-11-25 14:57:21.749	\N
de3qoffmrp2gtqgab4w62mii	xxevpbrra70t4616xwtbj2di	07234 BIRRA LEFFE BLONDE CL 33 X 24 0,33 CRT 24 40,35		BOX	\N	2025-11-25 14:57:22.397	2025-11-25 14:57:22.397	\N
xptq05sguems5orcdrby0ek4	xxevpbrra70t4616xwtbj2di	07383 BIRRA LEFFE ROUGE CL 33 X 24 0,33 CRT 24 40,50		L	\N	2025-11-25 14:57:23.032	2025-11-25 14:57:23.032	\N
nezwazz2jkle1mpinc76syy4	xxevpbrra70t4616xwtbj2di	07207 BIRRA LEFFE TRIPLE CL 33 X 24 0,33 CRT 24 46,50		BOX	\N	2025-11-25 14:57:23.673	2025-11-25 14:57:23.673	\N
ayigxmp8tx5gt5tmu9l8j54g	xxevpbrra70t4616xwtbj2di	07345 BIRRA BLANCHE DE NAMUR CL.75*6 0,75 CRT 6 22,50		L	\N	2025-11-25 14:57:24.303	2025-11-25 14:57:24.303	\N
jk22ljydvgch47nve53m7ro5	xxevpbrra70t4616xwtbj2di	07150 BIRRA CHOUFFE BLONDE CL75*12 0,75 CRT 12 56,40		L	\N	2025-11-25 14:57:24.938	2025-11-25 14:57:24.938	\N
vhumvmjshtvi1csmemocnh6s	xxevpbrra70t4616xwtbj2di	07431 BIRRA KWAK CL75*6 0,75 CRT 6 37,20		L	\N	2025-11-25 14:57:25.647	2025-11-25 14:57:25.647	\N
lt9rtw8sst7dd3lxs5isbi87	xxevpbrra70t4616xwtbj2di	07205 BIRRA LEFFE BLONDE CL 75 X 6 0,75 CRT 6 27,75		L	\N	2025-11-25 14:57:26.28	2025-11-25 14:57:26.28	\N
pcif138enszi9dcd2489apg5	xxevpbrra70t4616xwtbj2di	07125 FUSTO BIRRA WEIH.HEFEWEISSBIER  LT.15 15,00 FUS 1 52,50		PIECE	\N	2025-11-25 14:57:26.93	2025-11-25 14:57:26.93	\N
nvnttegpdu76xfh5kvog0l0p	xxevpbrra70t4616xwtbj2di	07170 FUSTO BIRRA GRANDA XTRA IPA LT 20 PET 20,00 FUS 1 78,75		PIECE	\N	2025-11-25 14:57:27.568	2025-11-25 14:57:27.568	\N
t1br8w24e9kswhpbh6dvlkd7	xxevpbrra70t4616xwtbj2di	07416 FUSTO BIRRA MENABREA NON FILTR  ATA 24 LT POLIKEG 24,00 FUS 1 67,50		PIECE	\N	2025-11-25 14:57:28.198	2025-11-25 14:57:28.198	\N
wzfwh74kwzwvtb5xkxf0aeml	xxevpbrra70t4616xwtbj2di	07388 FUSTO BIRRA BORGO LISA LT 20   BONUS LAZIO 20,00 FUS 1 66,00		PIECE	\N	2025-11-25 14:57:28.83	2025-11-25 14:57:28.83	\N
nlehahux8fm919on372s4b3q	xxevpbrra70t4616xwtbj2di	07389 FUSTO BIRRA BORGO MY ANTONIA  LT 20 BONUS LAZIO 20,00 FUS 1 105,00		PIECE	\N	2025-11-25 14:57:29.464	2025-11-25 14:57:29.464	\N
dqgwyjsmz84z9y39dkiv69oo	xxevpbrra70t4616xwtbj2di	07406 FUSTO BIRRA BORGO REALE EXTRA  LT 20 BONUS LAZIO 20,00 FUS 1 106,50		PIECE	\N	2025-11-25 14:57:30.104	2025-11-25 14:57:30.104	\N
m1gkkwj1f60cjx8riyez8t2g	xxevpbrra70t4616xwtbj2di	07394 FUSTO BIRRA BORGO REALE IPA LT  20 20,00 FUS 1 99,00		PIECE	\N	2025-11-25 14:57:30.741	2025-11-25 14:57:30.741	\N
fi9l6ws7zivdnikyr4c9c4xy	xxevpbrra70t4616xwtbj2di	07364 FUSTO BIRRA GOOSE IPA LT 20 20,00 FUS 1 99,00		PIECE	\N	2025-11-25 14:57:31.441	2025-11-25 14:57:31.441	\N
yjxyrkoeivali61uayudirsf	xxevpbrra70t4616xwtbj2di	07371 FUSTO BIRRA HOEGARDEN LT 20 20,00 FUS 1 72,00		PIECE	\N	2025-11-25 14:57:32.075	2025-11-25 14:57:32.075	\N
v9ryglx581smxu7pp015ct2g	xxevpbrra70t4616xwtbj2di	07370 FUSTO BIRRA LEFFE BLONDE LT 20 20,00 FUS 1 87,75		PIECE	\N	2025-11-25 14:57:32.704	2025-11-25 14:57:32.704	\N
rkua36gf6t2byrhvy133qmsu	xxevpbrra70t4616xwtbj2di	07369 FUSTO BIRRA LEFFE ROUGE LT 20 20,00 FUS 1 87,75		PIECE	\N	2025-11-25 14:57:33.34	2025-11-25 14:57:33.34	\N
e2jeyj15uj5acnzglh214bqz	xxevpbrra70t4616xwtbj2di	07213 FUSTO BIRRA TOOL FIRST FRONTIE R KK LT 30 30,00 FUS 1 133,50		PIECE	\N	2025-11-25 14:57:33.972	2025-11-25 14:57:33.972	\N
zmxcqc079l8qbb07qrfsgs73	xxevpbrra70t4616xwtbj2di	07121 FUSTO BIRRA WEIHENST.VITUS DOP.MAL LT.30 30,00 FUS 1 105,75		PIECE	\N	2025-11-25 14:57:34.611	2025-11-25 14:57:34.611	\N
weulyya64e42auubwqxyhww1	xxevpbrra70t4616xwtbj2di	10083 CIRIO SUCCO POMODORO 24*200 0,20 CRT 24 13,95		BOX	\N	2025-11-25 14:57:35.24	2025-11-25 14:57:35.24	\N
ouwq7h0yclw15u6vib47v3ig	xxevpbrra70t4616xwtbj2di	10056 DERBY ACE ML 200 X 24 0,20 CRT 24 13,20		L	\N	2025-11-25 14:57:35.879	2025-11-25 14:57:35.879	\N
nxrkf20fs9wcvt2q23rxkyo3	xxevpbrra70t4616xwtbj2di	10029 DERBY ALBICOCCA ML 200 X 24 0,20 CRT 24 13,20		L	\N	2025-11-25 14:57:36.513	2025-11-25 14:57:36.513	\N
iprp8bopm4ubp9f0snwtf4m2	xxevpbrra70t4616xwtbj2di	10067 DERBY ANANAS NET. ML 200X24 0,20 CRT 24 13,50		L	\N	2025-11-25 14:57:37.173	2025-11-25 14:57:37.173	\N
vie6pwpzji1xbhhnhnveqfb5	xxevpbrra70t4616xwtbj2di	10069 DERBY AR.ROSSA ML 200 X 24 0,20 CRT 24 13,20		L	\N	2025-11-25 14:57:37.809	2025-11-25 14:57:37.809	\N
d26icx78qjekr7bqjfuxlqlp	xxevpbrra70t4616xwtbj2di	10066 DERBY ARANCIA ML 200 X 24 0,20 CRT 24 13,20		L	\N	2025-11-25 14:57:38.443	2025-11-25 14:57:38.443	\N
pjwbloaddl7xh99dulc169fb	xxevpbrra70t4616xwtbj2di	10068 DERBY MANGO/PESCA ML 200 X 24 0,20 CRT 24 13,20		L	\N	2025-11-25 14:57:39.078	2025-11-25 14:57:39.078	\N
tgpwrpaosv4hnezw0ytdm9c6	xxevpbrra70t4616xwtbj2di	10071 DERBY MIRTILLO ML 200 X 24 0,20 CRT 24 21,00		L	\N	2025-11-25 14:57:39.711	2025-11-25 14:57:39.711	\N
kd231uom4arnim97au7rotl8	xxevpbrra70t4616xwtbj2di	10057 DERBY PERA ML 200 X 24 0,20 CRT 24 13,20		L	\N	2025-11-25 14:57:40.417	2025-11-25 14:57:40.417	\N
ip0hu1f0w5lixz13ehlh0cgb	xxevpbrra70t4616xwtbj2di	10028 DERBY PESCA ML 200 X 24 0,20 CRT 24 13,20		L	\N	2025-11-25 14:57:41.057	2025-11-25 14:57:41.057	\N
gb0dbk77to79f3ryjdpqyhcl	xxevpbrra70t4616xwtbj2di	10054 DERBY POMPELMO ML 200*24 0,20 CRT 24 13,20		L	\N	2025-11-25 14:57:41.687	2025-11-25 14:57:41.687	\N
b7btg7iaxuyfbxadzmxewoxd	xxevpbrra70t4616xwtbj2di	10035 YOGA M. ACE ML.200*24 0,20 CRT 24 14,25		L	\N	2025-11-25 14:57:42.318	2025-11-25 14:57:42.318	\N
e67nfhlu3xxjz6ybm37ai1sv	xxevpbrra70t4616xwtbj2di	10033 YOGA M. ALBICOCCA ML .200*24 0,20 CRT 24 14,25		L	\N	2025-11-25 14:57:42.959	2025-11-25 14:57:42.959	\N
ql2x42ilscuw35i6qbbpgogy	xxevpbrra70t4616xwtbj2di	10085 YOGA M. ANANAS 100% S.Z. ML200 X24 0,20 CRT 24 17,25		L	\N	2025-11-25 14:57:43.591	2025-11-25 14:57:43.591	\N
eiyfwvdetfa7e180n621h3tk	xxevpbrra70t4616xwtbj2di	10034 YOGA M. ANANAS NETTAR ML200*24 0,20 CRT 24 14,48		L	\N	2025-11-25 14:57:44.227	2025-11-25 14:57:44.227	\N
dyrxsp2ha7ihzaoecb7b6r74	xxevpbrra70t4616xwtbj2di	10036 YOGA M. AR.ROSSA ML.200*24 0,20 CRT 24 14,25		L	\N	2025-11-25 14:57:44.866	2025-11-25 14:57:44.866	\N
ug7o9fdm0eunxjhzk8z4rwud	xxevpbrra70t4616xwtbj2di	10053 YOGA M. ARAN.ROSSA/MIRTILLO ML. 200*24 0,20 CRT 24 14,25		L	\N	2025-11-25 14:57:45.597	2025-11-25 14:57:45.597	\N
e5vgxcf62bo00a0atvdc4cd1	xxevpbrra70t4616xwtbj2di	10043 YOGA M. ARANCIA 24*200 0,20 CRT 24 14,25		BOX	\N	2025-11-25 14:57:46.228	2025-11-25 14:57:46.228	\N
koovzwvlqn5r3ztlqaifqds7	xxevpbrra70t4616xwtbj2di	10044 YOGA M. BANANA 24*200 0,20 CRT 24 14,25		BOX	\N	2025-11-25 14:57:46.871	2025-11-25 14:57:46.871	\N
bzwxfk4k117nklqgozudesax	xxevpbrra70t4616xwtbj2di	10045 YOGA M. COCCO/ANANAS ML 200 0,20 CRT 24 14,25		L	\N	2025-11-25 14:57:47.507	2025-11-25 14:57:47.507	\N
dufcjqfr90qorz78src3e8st	xxevpbrra70t4616xwtbj2di	10049 YOGA M. FRAGOLA ML. 200*24 0,20 CRT 24 17,25		L	\N	2025-11-25 14:57:48.136	2025-11-25 14:57:48.136	\N
vbjeqbvxvsr9x0ruyn4hho2s	xxevpbrra70t4616xwtbj2di	10027 YOGA M. MELA LIMPIDA ML 200X24 0,20 CRT 24 14,25		L	\N	2025-11-25 14:57:48.769	2025-11-25 14:57:48.769	\N
rm33fqgkwthcjerh9k3ciuyr	xxevpbrra70t4616xwtbj2di	10039 YOGA M. MELA VERDE ML.200*24 0,20 CRT 24 14,25		L	\N	2025-11-25 14:57:49.402	2025-11-25 14:57:49.402	\N
k3jilfj7g5t0c3qf5za3tz5v	xxevpbrra70t4616xwtbj2di	10055 YOGA M. MELOGRANO ML.200*24 0,20 CRT 24 17,25		PIECE	\N	2025-11-25 14:57:50.035	2025-11-25 14:57:50.035	\N
db5phinimlhl3i6vrrbqa5y0	xxevpbrra70t4616xwtbj2di	10037 YOGA M. MIRTILLO ML.200*24 0,20 CRT 24 21,75		L	\N	2025-11-25 14:57:51.386	2025-11-25 14:57:51.386	\N
vffk1ebz4on6wfdhz74kinsv	xxevpbrra70t4616xwtbj2di	10031 YOGA M. PERA  ML. 200*24 0,20 CRT 24 14,25		L	\N	2025-11-25 14:57:52.393	2025-11-25 14:57:52.393	\N
r49wver6hmmuj5bzgbmfynbz	xxevpbrra70t4616xwtbj2di	10025 YOGA M. PERA/NOCCIOLA ML 200* 24 0,20 CRT 24 17,25		L	\N	2025-11-25 14:57:53.034	2025-11-25 14:57:53.034	\N
l0c7ugd10mgva66zv7bs3oec	xxevpbrra70t4616xwtbj2di	10032 YOGA M. PESCA ML.200*24 0,20 CRT 24 14,25		L	\N	2025-11-25 14:57:53.669	2025-11-25 14:57:53.669	\N
cp8o9caowjlnk1bq1nwot4gy	xxevpbrra70t4616xwtbj2di	10021 YOGA M. PESCA/MANDORLA ML 200* 24 0,20 CRT 24 17,25		L	\N	2025-11-25 14:57:54.312	2025-11-25 14:57:54.312	\N
k4t6c0v8ic2bsxiwq636nihc	xxevpbrra70t4616xwtbj2di	10052 YOGA M. PESCA/MANGO ML.200*24 0,20 CRT 24 14,25		L	\N	2025-11-25 14:57:54.948	2025-11-25 14:57:54.948	\N
qcqlqkex3nowul09kn95mte8	xxevpbrra70t4616xwtbj2di	10038 YOGA M. POMPELMO ML.200*24 0,20 CRT 24 14,25		L	\N	2025-11-25 14:57:55.582	2025-11-25 14:57:55.582	\N
y9g0mglhxipaan0qs7sugfws	xxevpbrra70t4616xwtbj2di	10072 DERBY LT ANANAS 1 *6 1,00 CRT 6 10,35		BOX	\N	2025-11-25 14:57:56.225	2025-11-25 14:57:56.225	\N
iara8km5z145e3pm4xew3muu	xxevpbrra70t4616xwtbj2di	10073 DERBY LT ARANCIO 1 *6 1,00 CRT 6 10,35		BOX	\N	2025-11-25 14:57:56.861	2025-11-25 14:57:56.861	\N
ig3czruonffm3j7z40wigtjx	xxevpbrra70t4616xwtbj2di	10074 DERBY LT POMPELMO 1 *6 1,00 CRT 6 11,48		BOX	\N	2025-11-25 14:57:57.497	2025-11-25 14:57:57.497	\N
wkkppnzuujxpu3wl4l86j0kb	xxevpbrra70t4616xwtbj2di	10018 YOGA  LT ACE 1*6 1,00 CRT 6 8,25		BOX	\N	2025-11-25 14:57:58.132	2025-11-25 14:57:58.132	\N
tkyydm6t728v91ggdcebprdy	xxevpbrra70t4616xwtbj2di	10047 YOGA  LT PERA 1*6 1,00 CRT 6 8,25		BOX	\N	2025-11-25 14:57:58.769	2025-11-25 14:57:58.769	\N
omb1j4cze4kfjdu3on15jpkp	xxevpbrra70t4616xwtbj2di	10051 YOGA  LT PESCA 1*6 1,00 CRT 6 8,25		BOX	\N	2025-11-25 14:57:59.416	2025-11-25 14:57:59.416	\N
dig7rpdv6px7ba82kqixg97z	xxevpbrra70t4616xwtbj2di	14161 BITTER PEYCHAUD'S ML 148 0,15 BOT 1 12,60		L	\N	2025-11-25 14:58:00.048	2025-11-25 14:58:00.048	\N
xqauxdgqmjwps7fu16ti9dvf	xxevpbrra70t4616xwtbj2di	04321 FEVER TREE REFRESHINGLY LIGHT  ML 200*24 0,20 CRT 24 26,25		L	\N	2025-11-25 14:58:00.68	2025-11-25 14:58:00.68	\N
wgrn7jps8a01p3maw5hklp5q	xxevpbrra70t4616xwtbj2di	15132 APERITATTICO CAVAR ACIDO  LT 1,00 BOT 1 11,85		PIECE	\N	2025-11-25 14:58:01.311	2025-11-25 14:58:01.311	\N
f9mrl822w0vhr5y20c6prw9x	xxevpbrra70t4616xwtbj2di	15133 APERITATTICO CAVAR FRIVOLO  LT 1,00 BOT 1 11,85		PIECE	\N	2025-11-25 14:58:02.018	2025-11-25 14:58:02.018	\N
k52gr9k9n4brp6c9aoyj0qyu	xxevpbrra70t4616xwtbj2di	15134 APERITATTICO CAVAR LT 1,00 BOT 1 11,85		PIECE	\N	2025-11-25 14:58:02.649	2025-11-25 14:58:02.649	\N
l4l903hc5xnbish2orjewh6l	xxevpbrra70t4616xwtbj2di	15130 APERITATTICO CAVAR MOLESTO ZEN ZERO LT 1,00 BOT 1 11,85		PIECE	\N	2025-11-25 14:58:03.282	2025-11-25 14:58:03.282	\N
u0ucjqs60rkt2ido4dv0n50y	xxevpbrra70t4616xwtbj2di	14849 APERITIVO AMERICANO COCCHI CL  75 0,75 BOT 1 17,40		L	\N	2025-11-25 14:58:03.912	2025-11-25 14:58:03.912	\N
lvh88dbm1dpe2cg4h2lyx4a9	xxevpbrra70t4616xwtbj2di	14983 aperitivo cappelletti cl 75 0,75 BOT 1 12,15		L	\N	2025-11-25 14:58:04.557	2025-11-25 14:58:04.557	\N
lkc6zijgplie0g2qrh0bgkd0	xxevpbrra70t4616xwtbj2di	14966 APERITIVO GAMONDI  LT 1,00 BOT 1 6,83		PIECE	\N	2025-11-25 14:58:05.198	2025-11-25 14:58:05.198	\N
ebv0vaorxyg8qar8h147942k	xxevpbrra70t4616xwtbj2di	14968 APERITIVO GAMONDI FIORI SAMBUC  O LT 1,00 BOT 1 13,50		PIECE	\N	2025-11-25 14:58:05.835	2025-11-25 14:58:05.835	\N
sr5dprre7xgkq3cm90tvk3hq	xxevpbrra70t4616xwtbj2di	14920 APERITIVO GREEN P31  LT 1,00 BOT 1 12,15		PIECE	\N	2025-11-25 14:58:06.542	2025-11-25 14:58:06.542	\N
yim1ldnzey96uhh3cdvitzcv	xxevpbrra70t4616xwtbj2di	14795 APERITIVO LUXARDO LT 1 1,00 BOT 1 8,25		PIECE	\N	2025-11-25 14:58:07.174	2025-11-25 14:58:07.174	\N
yxapswjt7t7m6vjvcc6chsil	xxevpbrra70t4616xwtbj2di	14767 APERITIVO MONDORO FIORI SAMBUC O CL 70 0,70 BOT 1 9,15		L	\N	2025-11-25 14:58:07.808	2025-11-25 14:58:07.808	\N
mzxunmpyi59ijbzc7ptas3tx	xxevpbrra70t4616xwtbj2di	14772 APERITIVO PINK CITRUS GAMONDI LT 1,00 BOT 1 11,25		PIECE	\N	2025-11-25 14:58:08.44	2025-11-25 14:58:08.44	\N
vsuh74ad5z5084rtccagntw1	xxevpbrra70t4616xwtbj2di	14515 APERITIVO ROSSO ITALIANO LT 1 1,00 BOT 1 5,70		PIECE	\N	2025-11-25 14:58:09.08	2025-11-25 14:58:09.08	\N
rd5qi48d9czxahmb5azyihr2	xxevpbrra70t4616xwtbj2di	14625 APERITIVO VILLA CARDEA LT 1 1,00 BOT 1 6,08		PIECE	\N	2025-11-25 14:58:09.714	2025-11-25 14:58:09.714	\N
wbijtwbh0uqqeupvsnnb6swc	xxevpbrra70t4616xwtbj2di	14229 APEROL BARBIERI 11 CL.100*1 1,00 BOT 1 12,60		PIECE	\N	2025-11-25 14:58:10.35	2025-11-25 14:58:10.35	\N
jvyrsu0fryedl64dnq87e9yv	xxevpbrra70t4616xwtbj2di	14200 APEROL LT 3 3,00 BOT 1 54,75		PIECE	\N	2025-11-25 14:58:10.985	2025-11-25 14:58:10.985	\N
rji5c7n41887js5wcb6jzzab	xxevpbrra70t4616xwtbj2di	14248 BIANCOSARTI 28 CL.100 1,00 BOT 1 18,38		PIECE	\N	2025-11-25 14:58:11.617	2025-11-25 14:58:11.617	\N
rtlca3e491irwo9zaex1jzb9	xxevpbrra70t4616xwtbj2di	14697 BITTER AMARGO CHUNCHO CL 7,5 0,08 BOT 1 11,63		PIECE	\N	2025-11-25 14:58:12.25	2025-11-25 14:58:12.25	\N
z6anqk1vrynu5yipdqu5s1hw	xxevpbrra70t4616xwtbj2di	14914 BITTER APERITIVO SELECT LT 1 1,00 BOT 1 13,73		BOX	\N	2025-11-25 14:58:12.888	2025-11-25 14:58:12.888	\N
fwjlxh39npms9t3ftc5qouym	xxevpbrra70t4616xwtbj2di	14231 BITTER CAMPARI LT.1 1,00 BOT 1 17,10		PIECE	\N	2025-11-25 14:58:13.614	2025-11-25 14:58:13.614	\N
pz9tazh3fow9khtf29hzt9ja	xxevpbrra70t4616xwtbj2di	14967 BITTER GAMONDI LT 1,00 BOT 1 9,75		PIECE	\N	2025-11-25 14:58:14.258	2025-11-25 14:58:14.258	\N
yvbarcd0hlatju8x5ncpcqs5	xxevpbrra70t4616xwtbj2di	14782 BITTER MARTINI CL 70 0,70 BOT 1 8,48		L	\N	2025-11-25 14:58:14.891	2025-11-25 14:58:14.891	\N
pehb1wwjyxqtkqgda89443r9	xxevpbrra70t4616xwtbj2di	14062 BITTER MARTINI LT 1,00 BOT 1 12,00		PIECE	\N	2025-11-25 14:58:15.529	2025-11-25 14:58:15.529	\N
f4zizodq170w7aupizlnfd8b	xxevpbrra70t4616xwtbj2di	14919 BITTER MARTINI RIS.SPEC.PREMIU  M 1872 CL 70 0,70 BOT 1 15,75		L	\N	2025-11-25 14:58:16.169	2025-11-25 14:58:16.169	\N
p1gctvuzk7qceqqc770pjiqv	xxevpbrra70t4616xwtbj2di	14834 BITTER MONIN CL 70 0,70 BOT 1 12,53		L	\N	2025-11-25 14:58:16.803	2025-11-25 14:58:16.803	\N
c05cxb0a9x7g1huglw94tsq1	xxevpbrra70t4616xwtbj2di	15068 BITTER ROSSO BORBONE CL 70 0,70 BOT 1 11,25		L	\N	2025-11-25 14:58:17.436	2025-11-25 14:58:17.436	\N
d4ovhznjruh35q5s3smd1b9d	xxevpbrra70t4616xwtbj2di	14624 BITTER VILLA CARDEA LT 1 1,00 BOT 1 7,69		PIECE	\N	2025-11-25 14:58:18.15	2025-11-25 14:58:18.15	\N
f8i4gdw5t3eia0xvq7f8eefe	xxevpbrra70t4616xwtbj2di	15050 GINGER KING'S CL 50 0,50 BOT 1 23,10		L	\N	2025-11-25 14:58:18.793	2025-11-25 14:58:18.793	\N
b62lessttwyp6mmf4flct8sy	xxevpbrra70t4616xwtbj2di	14802 MARTINI FIERO L' APERITIVO LT 1,00 BOT 1 10,20		PIECE	\N	2025-11-25 14:58:19.423	2025-11-25 14:58:19.423	\N
mcuuufm80521kmg4cxje9t8j	xxevpbrra70t4616xwtbj2di	14582 MARTINI FLOREALE CL 75 0,75 BOT 1 9,75		L	\N	2025-11-25 14:58:20.073	2025-11-25 14:58:20.073	\N
kd6cogvqxiv1y7lqqb9up579	xxevpbrra70t4616xwtbj2di	14581 MARTINI VIBRANTE CL 75 0,75 BOT 1 9,75		L	\N	2025-11-25 14:58:20.713	2025-11-25 14:58:20.713	\N
sjv1cc5nf6xq9f9dbe7a13hh	xxevpbrra70t4616xwtbj2di	14500 SARTI ROSA CL 70*1 0,70 BOT 1 15,00		L	\N	2025-11-25 14:58:21.346	2025-11-25 14:58:21.346	\N
xijgrjr8lkux49yv8rfxintz	xxevpbrra70t4616xwtbj2di	15152 FUSTO APEROL SPRITZ LT 20 20,00 FUS 1 138,75		PIECE	\N	2025-11-25 14:58:22.052	2025-11-25 14:58:22.052	\N
wjwvt7b4lbqy7u4mjc1r169c	xxevpbrra70t4616xwtbj2di	14368 AMARETTO DI SARONNO CL 100 1,00 BOT 1 18,23		PIECE	\N	2025-11-25 14:58:22.681	2025-11-25 14:58:22.681	\N
lfp1ypaojcvb0fggbvzfz4qq	xxevpbrra70t4616xwtbj2di	14282 AMARICATO AL MEZCAL CL 70 0,70 BOT 1 24,00		L	\N	2025-11-25 14:58:23.315	2025-11-25 14:58:23.315	\N
hma6eudjhglhgfmld0jupnsp	xxevpbrra70t4616xwtbj2di	14361 AMARICATO AL RUM CL 70 0,70 BOT 1 24,00		L	\N	2025-11-25 14:58:23.944	2025-11-25 14:58:23.944	\N
jr8wepxr7j25fvuxlc946pef	xxevpbrra70t4616xwtbj2di	14311 AMARICATO AL WHISKY CL 70 0,70 BOT 1 24,00		L	\N	2025-11-25 14:58:24.579	2025-11-25 14:58:24.579	\N
hvxqjva7mgsxg712bc4dw9xd	xxevpbrra70t4616xwtbj2di	15102 AMARO "AMARA" ARANC CL 70 0,70 BOT 1 28,20		L	\N	2025-11-25 14:58:25.219	2025-11-25 14:58:25.219	\N
hex765zwm9sgdl9yxrty6zr8	xxevpbrra70t4616xwtbj2di	14092 AMARO 207 LOCALE CL 70 0,70 BOT 1 25,50		L	\N	2025-11-25 14:58:25.853	2025-11-25 14:58:25.853	\N
l1ab0qu2cn3zy65np7539lw7	xxevpbrra70t4616xwtbj2di	14355 AMARO ALPESTRE CL 70 0,70 BOT 1 22,20		L	\N	2025-11-25 14:58:26.533	2025-11-25 14:58:26.533	\N
xmhx4v9llk235nhn9pp44sq6	xxevpbrra70t4616xwtbj2di	14982 AMARO AMARIO A.GRADAZIONE  CL 70 0,70 BOT 1 20,78		L	\N	2025-11-25 14:58:27.173	2025-11-25 14:58:27.173	\N
n1uvo1n5skuoupdunl16i5st	xxevpbrra70t4616xwtbj2di	14273 AMARO AVERNA  LT. 1 1,00 BOT 1 18,00		PIECE	\N	2025-11-25 14:58:27.807	2025-11-25 14:58:27.807	\N
fav3odppqmoujdfwj946gfds	xxevpbrra70t4616xwtbj2di	14831 AMARO AVERNA  LT. 3 3,00 BOT 1 82,50		PIECE	\N	2025-11-25 14:58:28.477	2025-11-25 14:58:28.477	\N
uea15bbk47bqpv88cntsfapw	xxevpbrra70t4616xwtbj2di	14299 AMARO BORBONE 10 MAGGIO 1734 CL 70 0,70 BOT 1 17,25		L	\N	2025-11-25 14:58:29.12	2025-11-25 14:58:29.12	\N
fcm9o7ytd8s8jq36cl0d1usu	xxevpbrra70t4616xwtbj2di	15100 AMARO BORBONE NOBILE RUCOLA CL 70 0,70 BOT 1 17,25		L	\N	2025-11-25 14:58:29.76	2025-11-25 14:58:29.76	\N
qqeu58mful3a6v2k4imelnbe	xxevpbrra70t4616xwtbj2di	14409 AMARO BORSCI S.MARZANO LITRO 1,00 BOT 1 18,53		PIECE	\N	2025-11-25 14:58:30.398	2025-11-25 14:58:30.398	\N
eh14pr754epunqf6uc6nyic4	xxevpbrra70t4616xwtbj2di	14284 AMARO BRANCAMENTA LT. 1 1,00 BOT 1 19,65		PIECE	\N	2025-11-25 14:58:31.09	2025-11-25 14:58:31.09	\N
zdltsfk1x25eh5110d7uw34m	xxevpbrra70t4616xwtbj2di	14341 AMARO BRAULIO LT1 1,00 BOT 1 17,78		PIECE	\N	2025-11-25 14:58:31.727	2025-11-25 14:58:31.727	\N
vbfm6dti9lchy1ksjra4v6w0	xxevpbrra70t4616xwtbj2di	15025 AMARO CYNAR 70 PROOF LT 1 1,00 BOT 1 22,13		PIECE	\N	2025-11-25 14:58:32.362	2025-11-25 14:58:32.362	\N
fxx7wapvr8wyfnw7qcmikkbm	xxevpbrra70t4616xwtbj2di	14343 AMARO CYNAR LT 1 1,00 BOT 1 16,88		PIECE	\N	2025-11-25 14:58:33.027	2025-11-25 14:58:33.027	\N
pa6bl315ugjumh8yi4rzvied	xxevpbrra70t4616xwtbj2di	14319 AMARO DEL CAPO LT 1 1,00 BOT 1 16,95		PIECE	\N	2025-11-25 14:58:33.661	2025-11-25 14:58:33.661	\N
vv0ulqo75rs1z2ec414o4u1n	xxevpbrra70t4616xwtbj2di	14731 AMARO DEL CAPO LT 1,5 MAGNUM 1,50 BOT 1 24,90		L	\N	2025-11-25 14:58:34.314	2025-11-25 14:58:34.314	\N
ox0zc8wfhrv1y1rbwuqdbbwa	xxevpbrra70t4616xwtbj2di	14902 AMARO DEL CAPO RED HOT PEPERON  CINO LT 1,00 BOT 1 25,65		PIECE	\N	2025-11-25 14:58:34.945	2025-11-25 14:58:34.945	\N
cjelmc2greblibyuiznk2htb	xxevpbrra70t4616xwtbj2di	14776 AMARO DEL CICLISTA CL 70 0,70 BOT 1 11,85		L	\N	2025-11-25 14:58:35.582	2025-11-25 14:58:35.582	\N
lbnbu7pgpyk828uol3z14mmo	xxevpbrra70t4616xwtbj2di	14954 AMARO DI CICCO ABRUZZESE LT 1 1,00 BOT 1 9,00		PIECE	\N	2025-11-25 14:58:36.216	2025-11-25 14:58:36.216	\N
t5a6oz0v9f9mu2p6v16aeb0k	xxevpbrra70t4616xwtbj2di	14959 AMARO DI CICCO APPENNINO LT 2 2,00 BOT 1 11,78		PIECE	\N	2025-11-25 14:58:36.916	2025-11-25 14:58:36.916	\N
pggo0n0d28q3p6slum30a4om	xxevpbrra70t4616xwtbj2di	14373 AMARO DI SARONNO VELVET CL 70 0,70 BOT 1 15,00		L	\N	2025-11-25 14:58:37.56	2025-11-25 14:58:37.56	\N
bru1fu1c4i9dekc6ayhjn1x2	xxevpbrra70t4616xwtbj2di	14251 AMARO FERNET BRANCA CL .100 1,00 BOT 1 20,70		L	\N	2025-11-25 14:58:38.193	2025-11-25 14:58:38.193	\N
i6zjzic297wqr87ck3xlfwlq	xxevpbrra70t4616xwtbj2di	14798 AMARO FORMIDABILE CL 70 0,70 BOT 1 26,10		L	\N	2025-11-25 14:58:38.848	2025-11-25 14:58:38.848	\N
yqbeqp6u5rdbuvckiooom007	xxevpbrra70t4616xwtbj2di	15024 AMARO HOJA DE COTA AMUERTE CL  70 0,70 BOT 1 26,70		L	\N	2025-11-25 14:58:39.482	2025-11-25 14:58:39.482	\N
d6scvf4py39pgvd8tjyx6fkb	xxevpbrra70t4616xwtbj2di	14978 AMARO IL CARLINA CL 70 0,70 BOT 1 16,13		L	\N	2025-11-25 14:58:40.118	2025-11-25 14:58:40.118	\N
m0yvr54it3jp8m5to2sa5mrh	xxevpbrra70t4616xwtbj2di	14775 AMARO JAGERM. MANIFEST  LT 1 1,00 BOT 1 33,00		PIECE	\N	2025-11-25 14:58:40.765	2025-11-25 14:58:40.765	\N
vs9gufwrf3zci70x09594oiz	xxevpbrra70t4616xwtbj2di	14240 AMARO JAGERMEISTER LT 1 1,00 BOT 1 17,25		PIECE	\N	2025-11-25 14:58:41.411	2025-11-25 14:58:41.411	\N
u7zlvdl3xo37v372pb1bzxzp	xxevpbrra70t4616xwtbj2di	14722 AMARO JANNAMICO LT 1 1,00 BOT 1 15,38		PIECE	\N	2025-11-25 14:58:42.05	2025-11-25 14:58:42.05	\N
r6ahnj19c9lvfp8nbikuu218	xxevpbrra70t4616xwtbj2di	14806 AMARO JEFFERSON IMPORTANTE CL  70 0,70 BOT 1 26,33		L	\N	2025-11-25 14:58:42.701	2025-11-25 14:58:42.701	\N
jaaiz7moi8vpouay0w0zr2m0	xxevpbrra70t4616xwtbj2di	14344 AMARO LUCANO LT 1 1,00 BOT 1 13,95		PIECE	\N	2025-11-25 14:58:43.333	2025-11-25 14:58:43.333	\N
yn1ajmxqgxil7ch755ops67a	xxevpbrra70t4616xwtbj2di	14986 AMARO MAFFEI CL 70 0,70 BOT 1 24,45		L	\N	2025-11-25 14:58:43.977	2025-11-25 14:58:43.977	\N
orucky3nqmd87byskq1f5mmw	xxevpbrra70t4616xwtbj2di	14807 AMARO MENNULA CL 70 0,70 BOT 1 9,38		L	\N	2025-11-25 14:58:44.655	2025-11-25 14:58:44.655	\N
s1hkqfhvtip04itbi2wu4wie	xxevpbrra70t4616xwtbj2di	14586 AMARO MONTENEGRO CL 70 0,70 BOT 1 14,63		L	\N	2025-11-25 14:58:45.287	2025-11-25 14:58:45.287	\N
yub9wcqgoiv5y7a4alp43hxn	xxevpbrra70t4616xwtbj2di	14309 AMARO PETRUS 70 CL 0,70 BOT 1 13,95		L	\N	2025-11-25 14:58:45.92	2025-11-25 14:58:45.92	\N
xrit9gwrrihz0fe3uovpxbar	xxevpbrra70t4616xwtbj2di	14369 AMARO RABARBARO ZUCCA  LT.1 1,00 BOT 1 13,88		PIECE	\N	2025-11-25 14:58:46.56	2025-11-25 14:58:46.56	\N
qg44oc5ifsaf0sqc0xzksaq9	xxevpbrra70t4616xwtbj2di	14830 AMARO RABARBARO ZUCCA CL 70 R  ISERVA 0,70 BOT 1 14,63		L	\N	2025-11-25 14:58:47.199	2025-11-25 14:58:47.199	\N
vq71a9v3yjnvh434ev5x52r2	xxevpbrra70t4616xwtbj2di	14301 AMARO RAMAZZOTTI CL 100 1,00 BOT 1 16,35		PIECE	\N	2025-11-25 14:58:47.837	2025-11-25 14:58:47.837	\N
ujkxn1yks1n4vuojhd6bxlcc	xxevpbrra70t4616xwtbj2di	14852 AMARO RUPES CL.100 1,00 BOT 1 19,13		PIECE	\N	2025-11-25 14:58:48.478	2025-11-25 14:58:48.478	\N
i39jtl84fz0fbyt4lqd6mn8h	xxevpbrra70t4616xwtbj2di	14931 AMARO SAN SIMONE CL 70 0,70 BOT 1 15,38		L	\N	2025-11-25 14:58:49.12	2025-11-25 14:58:49.12	\N
fn2qxxgctdfnbiwjcqloppez	xxevpbrra70t4616xwtbj2di	14981 AMARO SFUMATO CAPPELLETTI CL70 0,70 BOT 1 17,48		L	\N	2025-11-25 14:58:49.758	2025-11-25 14:58:49.758	\N
mlbkg8bqd7k3j3gmw61pi55y	xxevpbrra70t4616xwtbj2di	14848 AMARO SIBILLA VARNELLI LT 1 1,00 BOT 1 24,30		PIECE	\N	2025-11-25 14:58:50.39	2025-11-25 14:58:50.39	\N
sp4n5rol9x4ppwstd0609xyk	xxevpbrra70t4616xwtbj2di	14979 AMARO STILLA CL 50 0,50 BOT 1 19,50		L	\N	2025-11-25 14:58:51.032	2025-11-25 14:58:51.032	\N
xq76ax6g4kiq563srja9i4w9	xxevpbrra70t4616xwtbj2di	14698 AMARO TONICO ERBORISTA VARNELL I LT 1,00 BOT 1 28,50		PIECE	\N	2025-11-25 14:58:51.666	2025-11-25 14:58:51.666	\N
wbdykgosmybhs0h17iigg3js	xxevpbrra70t4616xwtbj2di	14247 AMARO UNICUM CL.100 1,00 BOT 1 17,93		PIECE	\N	2025-11-25 14:58:52.37	2025-11-25 14:58:52.37	\N
mjvrte2u138v9k18upbq5j85	xxevpbrra70t4616xwtbj2di	14512 LIMONCELLO BENVENUTI CL 70 0,70 BOT 1 10,50		L	\N	2025-11-25 14:58:53.01	2025-11-25 14:58:53.01	\N
wojuux7zckkrszb5ifha8epi	xxevpbrra70t4616xwtbj2di	14993 LIMONCELLO CUTINA LT.1 1,00 BOT 1 15,38		PIECE	\N	2025-11-25 14:58:53.643	2025-11-25 14:58:53.643	\N
o5qlf5xgrptnq2ijl78tdnal	xxevpbrra70t4616xwtbj2di	14264 LIMONCELLO DI CAPRI MOLINARI LT.1 1,00 BOT 1 12,75		PIECE	\N	2025-11-25 14:58:54.28	2025-11-25 14:58:54.28	\N
csc74q2g7xm7iank95t65qaj	xxevpbrra70t4616xwtbj2di	14447 LIMONCELLO LIMONDORO LT.1 1,00 BOT 1 7,88		PIECE	\N	2025-11-25 14:58:54.917	2025-11-25 14:58:54.917	\N
wu0w549v85vo1fd30jrgexdb	xxevpbrra70t4616xwtbj2di	15156 LIMONCELLO PALLINI LT 1 1,00 BOT 1 11,55		L	\N	2025-11-25 14:58:55.565	2025-11-25 14:58:55.565	\N
asbs9vbqrr19x1ou2v3e2xpv	xxevpbrra70t4616xwtbj2di	14712 LIMONCETTA LUCANO LT 1 1,00 BOT 1 13,50		PIECE	\N	2025-11-25 14:58:56.197	2025-11-25 14:58:56.197	\N
rcbmv2e580dv81teaj5oqb9e	xxevpbrra70t4616xwtbj2di	15142 LIMONCINO DI CICCO 2 LT 2,00 BOT 1 14,85		PIECE	\N	2025-11-25 14:58:56.84	2025-11-25 14:58:56.84	\N
za2fkwusjcq4bj2zq28q02r7	xxevpbrra70t4616xwtbj2di	14278 COGNAC COURVOISIER VSOP CL. 70 0,70 BOT 1 46,50		L	\N	2025-11-25 14:58:57.483	2025-11-25 14:58:57.483	\N
i1ltohob26yctls1tipzsc1o	xxevpbrra70t4616xwtbj2di	14533 COGNAC HENNESSY CL 70 0,70 BOT 1 36,15		L	\N	2025-11-25 14:58:58.126	2025-11-25 14:58:58.126	\N
tawr98uaux6h373ya9bjzwzr	xxevpbrra70t4616xwtbj2di	14245 COGNAC MARTELL VS 3 STELLE CL.70 0,70 BOT 1 31,50		L	\N	2025-11-25 14:58:58.759	2025-11-25 14:58:58.759	\N
unxr5lcs6quk7fys23zd9uut	xxevpbrra70t4616xwtbj2di	14770 COGNAC PERE F.PEYROT CL 70 0,70 BOT 1 27,75		L	\N	2025-11-25 14:58:59.396	2025-11-25 14:58:59.396	\N
ckyxf74fki7u5kvpkfkszfxx	xxevpbrra70t4616xwtbj2di	14418 COGNAC REMY MARTIN VSOP CL 70 0,70 BOT 1 52,65		L	\N	2025-11-25 14:59:00.032	2025-11-25 14:59:00.032	\N
f23sx0kmhj6bnvwbvfjsjkrh	xxevpbrra70t4616xwtbj2di	15103 BRANDY ALAMEA PEACH CL 50 0,50 BOT 1 19,13		L	\N	2025-11-25 14:59:00.665	2025-11-25 14:59:00.665	\N
prrg85ix2y92dctgi1h772t3	xxevpbrra70t4616xwtbj2di	14746 BRANDY CARDENAL MENDOZA CL 70 0,70 BOT 1 27,00		L	\N	2025-11-25 14:59:01.307	2025-11-25 14:59:01.307	\N
rr3jld6m4061kzf18iaqx3vd	xxevpbrra70t4616xwtbj2di	14823 BRANDY CARLOS I  CL 70 0,70 BOT 1 30,38		L	\N	2025-11-25 14:59:01.946	2025-11-25 14:59:01.946	\N
yt2ukynnwuhuw2s3d9j3d2x3	xxevpbrra70t4616xwtbj2di	14416 BRANDY FUNDADOR CL. 70 0,70 BOT 1 12,75		L	\N	2025-11-25 14:59:02.587	2025-11-25 14:59:02.587	\N
oica3gjy08sbh2rp97wm4rzi	xxevpbrra70t4616xwtbj2di	14014 BRANDY METAXA 5 STELLE CL 70 0,70 BOT 1 16,28		L	\N	2025-11-25 14:59:03.22	2025-11-25 14:59:03.22	\N
w2u50nb803b7gmf1f8hauvts	xxevpbrra70t4616xwtbj2di	14298 BRANDY NAPOLEON DILMOOR CL100 1,00 BOT 1 8,63		PIECE	\N	2025-11-25 14:59:03.861	2025-11-25 14:59:03.861	\N
vtawgitmolwrym54rlvgsofi	xxevpbrra70t4616xwtbj2di	14326 STRAVECCHIO BRANCA LT.1*1 1,00 BOT 1 17,10		PIECE	\N	2025-11-25 14:59:04.497	2025-11-25 14:59:04.497	\N
c3kaxwoot8ljgn9diojtz7i7	xxevpbrra70t4616xwtbj2di	14039 VECCHIA ROMAGNA NERA CL.100 1,00 BOT 1 18,60		PIECE	\N	2025-11-25 14:59:05.143	2025-11-25 14:59:05.143	\N
w5bjykoe5hb4ps6ltz35e4ti	xxevpbrra70t4616xwtbj2di	14650 FARDO TANQUERAY 2 BT * LT 1 + KIT 1,00 CRT 2 53,25		BOX	\N	2025-11-25 14:59:05.781	2025-11-25 14:59:05.781	\N
k2r1c855j7xc4q687v4f2r1w	xxevpbrra70t4616xwtbj2di	14896 GIN  MALFY ARANCIA CL 70 0,70 BOT 1 27,23		L	\N	2025-11-25 14:59:06.424	2025-11-25 14:59:06.424	\N
hnja0289rpac3u36rv0xbd42	xxevpbrra70t4616xwtbj2di	14895 GIN  MALFY LIMONE CL 70 0,70 BOT 1 27,23		L	\N	2025-11-25 14:59:07.127	2025-11-25 14:59:07.127	\N
aod1rq4of6fxdgj970ohw9r2	xxevpbrra70t4616xwtbj2di	14890 GIN  MALFY ORIGINAL CL 70 0,70 BOT 1 25,05		L	\N	2025-11-25 14:59:07.76	2025-11-25 14:59:07.76	\N
q995sljxr5vuu1qivdn2o01f	xxevpbrra70t4616xwtbj2di	14897 GIN  MALFY ROSA CL 70 0,70 BOT 1 27,23		L	\N	2025-11-25 14:59:08.404	2025-11-25 14:59:08.404	\N
b9vspcq6btluj9xfmqgkr3hh	xxevpbrra70t4616xwtbj2di	14961 GIN ACQUE VERDI LT 1 1,00 BOT 1 31,50		L	\N	2025-11-25 14:59:09.038	2025-11-25 14:59:09.038	\N
sieq1a5naf1dmjnv7a66ranh	xxevpbrra70t4616xwtbj2di	14780 GIN AL CEDRO TASSONI CL 70 0,70 BOT 1 24,00		L	\N	2025-11-25 14:59:09.674	2025-11-25 14:59:09.674	\N
uq6bsgdu36blrys2z48bpuz0	xxevpbrra70t4616xwtbj2di	14960 GIN ALKEMIST CL 70 0,70 BOT 1 38,85		L	\N	2025-11-25 14:59:10.308	2025-11-25 14:59:10.308	\N
g2zylfakp2k3lt7ymbvd8hkp	xxevpbrra70t4616xwtbj2di	14991 GIN AMBROSIA SICILY CL 70 0,70 BOT 1 26,40		L	\N	2025-11-25 14:59:10.948	2025-11-25 14:59:10.948	\N
gqxa0qf0uekrxvjnxa72kyxr	xxevpbrra70t4616xwtbj2di	14877 GIN AMUERTE BLACK CL 70 0,70 BOT 1 55,58		L	\N	2025-11-25 14:59:11.581	2025-11-25 14:59:11.581	\N
oajpwlwhamn01ipzd65j23db	xxevpbrra70t4616xwtbj2di	15157 GIN AMUERTE BLUE CL 70 0,70 BOT 1 55,58		L	\N	2025-11-25 14:59:12.217	2025-11-25 14:59:12.217	\N
e20n40dfec5fsmpn3d4vteqm	xxevpbrra70t4616xwtbj2di	15158 GIN AMUERTE GREEN CL 70 0,70 BOT 1 55,58		L	\N	2025-11-25 14:59:12.865	2025-11-25 14:59:12.865	\N
tdsbkvlbrhs18gfbjuhlii70	xxevpbrra70t4616xwtbj2di	15160 GIN AMUERTE ORANGE CL 70 0,70 BOT 1 55,58		L	\N	2025-11-25 14:59:13.498	2025-11-25 14:59:13.498	\N
j56nzqn2bypuwo24154kqmh1	xxevpbrra70t4616xwtbj2di	14879 GIN AMUERTE RED CL 70 0,70 BOT 1 55,58		L	\N	2025-11-25 14:59:14.133	2025-11-25 14:59:14.133	\N
tkeivuvv5q9lad5ywgrwvz4m	xxevpbrra70t4616xwtbj2di	15126 GIN AMUERTE WHITE CL 70 0,70 BOT 1 55,58		L	\N	2025-11-25 14:59:14.854	2025-11-25 14:59:14.854	\N
km4xjs9x18fdwn8c8cnxd99j	xxevpbrra70t4616xwtbj2di	15159 GIN AMUERTE YELLOW CL 70 0,70 BOT 1 55,58		L	\N	2025-11-25 14:59:15.511	2025-11-25 14:59:15.511	\N
u8p64qfro75n7p5ms95g8zk9	xxevpbrra70t4616xwtbj2di	15058 GIN AQUAMARIS DRY DIST. CL 50 0,50 BOT 1 28,05		L	\N	2025-11-25 14:59:16.16	2025-11-25 14:59:16.16	\N
ytl4nam8twz679kj7303fj05	xxevpbrra70t4616xwtbj2di	15059 GIN AQUAMARIS GOLD EDITION CL  50 0,50 BOT 1 64,13		L	\N	2025-11-25 14:59:16.808	2025-11-25 14:59:16.808	\N
q7ricq6t5uf0i5g88fccbyz2	xxevpbrra70t4616xwtbj2di	14192 GIN AVIATION CL 70 0,70 BOT 1 30,30		L	\N	2025-11-25 14:59:17.442	2025-11-25 14:59:17.442	\N
zrq2wyasyhq0zpdbs3kuta3s	xxevpbrra70t4616xwtbj2di	14443 GIN BEEFEATER  24  CL. 70 0,70 BOT 1 22,88		L	\N	2025-11-25 14:59:18.079	2025-11-25 14:59:18.079	\N
vu9en93o93xd59tiw2lnlx3u	xxevpbrra70t4616xwtbj2di	14354 GIN BEEFEATER RED CL 100 1,00 BOT 1 18,00		PIECE	\N	2025-11-25 14:59:18.716	2025-11-25 14:59:18.716	\N
ws1j4q20sck69em1uv0d9yt3	xxevpbrra70t4616xwtbj2di	15111 GIN BEKERTON LT 1 1,00 BOT 1 12,60		PIECE	\N	2025-11-25 14:59:19.353	2025-11-25 14:59:19.353	\N
eawg1n2f8r3wcxppuaqopn48	xxevpbrra70t4616xwtbj2di	14523 GIN BICKENS 40* LT.1 1,00 BOT 1 12,68		PIECE	\N	2025-11-25 14:59:19.987	2025-11-25 14:59:19.987	\N
l1y3j9ij0q74iaws4sifbtza	xxevpbrra70t4616xwtbj2di	14926 GIN BOMBAY CL 50 0,50 BOT 1 16,43		L	\N	2025-11-25 14:59:20.641	2025-11-25 14:59:20.641	\N
ahddoviukw59tppq0q4yuowi	xxevpbrra70t4616xwtbj2di	14799 GIN BOMBAY SAPPHIRE  "PREMIER CRU" CL 70 0,70 BOT 1 31,13		L	\N	2025-11-25 14:59:21.307	2025-11-25 14:59:21.307	\N
p6hs51fufxegefxch9lxapoj	xxevpbrra70t4616xwtbj2di	14258 GIN BOMBAY SAPPHIRE 1LT 1,00 BOT 1 19,95		L	\N	2025-11-25 14:59:21.952	2025-11-25 14:59:21.952	\N
v0nln4s4ohybdrdn8cioz6p7	xxevpbrra70t4616xwtbj2di	15127 GIN BOMBAY SAPPHIRE CL 50 0,50 BOT 1 11,78		L	\N	2025-11-25 14:59:22.656	2025-11-25 14:59:22.656	\N
fx3vg5gg9frc07pzbksya12l	xxevpbrra70t4616xwtbj2di	14599 GIN BOMBAY SAPPHIRE CL 70 0,70 BOT 1 16,05		L	\N	2025-11-25 14:59:23.383	2025-11-25 14:59:23.383	\N
leankxp5h6b9ca46i9nrrjb4	xxevpbrra70t4616xwtbj2di	14473 GIN BOSFORD CL 70 0,70 BOT 1 8,33		L	\N	2025-11-25 14:59:24.026	2025-11-25 14:59:24.026	\N
d2dc6rie5cxuwyg1l4trb179	xxevpbrra70t4616xwtbj2di	14280 GIN BOSFORD CL. 100 1,00 BOT 1 10,80		PIECE	\N	2025-11-25 14:59:24.661	2025-11-25 14:59:24.661	\N
m9us3cswsk1ewlnt3fis47v9	xxevpbrra70t4616xwtbj2di	14702 GIN BOTANIST CL 70 0,70 BOT 1 36,00		L	\N	2025-11-25 14:59:25.297	2025-11-25 14:59:25.297	\N
fpjojv116wy694jlaw1iif42	xxevpbrra70t4616xwtbj2di	14459 GIN BULLDOG BOLD BLACK CL 70 0,70 BOT 1 16,50		L	\N	2025-11-25 14:59:25.931	2025-11-25 14:59:25.931	\N
u5d8qqtuka8be642wld12z8s	xxevpbrra70t4616xwtbj2di	15099 GIN BULLDOG LT 1 1,00 BOT 1 19,88		PIECE	\N	2025-11-25 14:59:26.568	2025-11-25 14:59:26.568	\N
urfjoi8rtn6ku0imy08hvaq7	xxevpbrra70t4616xwtbj2di	15155 GIN CELESTIAL ROSE' CL 70 0,70 BOT 1 33,15		L	\N	2025-11-25 14:59:27.201	2025-11-25 14:59:27.201	\N
qh538kzqkzhhf1k94siog49w	xxevpbrra70t4616xwtbj2di	15151 GIN CELESTIAL SUPERIOR CL 70 0,70 BOT 1 28,50		L	\N	2025-11-25 14:59:27.836	2025-11-25 14:59:27.836	\N
gv2gw4s1w5yb2xvh06lu8eeh	xxevpbrra70t4616xwtbj2di	14913 GIN CITADELLE ORIGINAL  44° CL 70 0,70 BOT 1 29,03		L	\N	2025-11-25 14:59:28.473	2025-11-25 14:59:28.473	\N
ubigezwxapbxkiva0nhfpekc	xxevpbrra70t4616xwtbj2di	15082 GIN CORRICELLA CL 70 0,70 BOT 1 28,95		L	\N	2025-11-25 14:59:29.109	2025-11-25 14:59:29.109	\N
bd49qhzps3xqpvht9zw53sk6	xxevpbrra70t4616xwtbj2di	15083 GIN CORRICELLA TANGERINE CL 70 0,70 BOT 1 28,95		L	\N	2025-11-25 14:59:29.747	2025-11-25 14:59:29.747	\N
vdl8luizhuvfqqbd2145u4pn	xxevpbrra70t4616xwtbj2di	15089 GIN CRESPO CL 70 0,70 BOT 1 41,18		L	\N	2025-11-25 14:59:30.383	2025-11-25 14:59:30.383	\N
ikgnsant5ruarbhydz36r7vi	xxevpbrra70t4616xwtbj2di	15090 GIN CRESPO LEGACY BARREL AGED CL 70 0,70 BOT 1 67,73		L	\N	2025-11-25 14:59:31.021	2025-11-25 14:59:31.021	\N
ixty2sl259tm8c701c47almi	xxevpbrra70t4616xwtbj2di	14487 GIN DEL PROF. CROCODILE CL 70 0,70 BOT 1 30,98		L	\N	2025-11-25 14:59:31.681	2025-11-25 14:59:31.681	\N
cr66dix27dp5rtqxo3c56su8	xxevpbrra70t4616xwtbj2di	14910 GIN DEL PROF. LA MADAME CL 70 0,70 BOT 1 28,50		L	\N	2025-11-25 14:59:32.36	2025-11-25 14:59:32.36	\N
lm8pbicnuofxdimnn0mg2145	xxevpbrra70t4616xwtbj2di	14911 GIN DEL PROF. MONSIEUR CL 70 0,70 BOT 1 28,50		L	\N	2025-11-25 14:59:32.995	2025-11-25 14:59:32.995	\N
c6r7fb70vp9qtsyj5nt5wp4q	xxevpbrra70t4616xwtbj2di	15145 GIN DI CICCO 2 LT 2,00 BOT 1 14,85		PIECE	\N	2025-11-25 14:59:33.629	2025-11-25 14:59:33.629	\N
tlp887lqv92jmdycadv9ozwc	xxevpbrra70t4616xwtbj2di	14734 GIN ELEPHANT CL.50 0,50 BOT 1 36,75		L	\N	2025-11-25 14:59:34.272	2025-11-25 14:59:34.272	\N
ledsfty7ev28y8pnpt7pc5k1	xxevpbrra70t4616xwtbj2di	14493 GIN ENGINE CL 70 0,70 BOT 1 29,25		L	\N	2025-11-25 14:59:34.911	2025-11-25 14:59:34.911	\N
q9e0u8wu1fq3i8wr2ecqkvf7	xxevpbrra70t4616xwtbj2di	14962 GIN ETSU JAPANESE CL 70 0,70 BOT 1 37,50		L	\N	2025-11-25 14:59:35.555	2025-11-25 14:59:35.555	\N
whla9z9q0b5mly575tvk2001	xxevpbrra70t4616xwtbj2di	14040 GIN FIFTY POUND CL 70 0,70 BOT 1 26,48		L	\N	2025-11-25 14:59:36.194	2025-11-25 14:59:36.194	\N
fh0yxqwgkhmdlpus9jwzxrzy	xxevpbrra70t4616xwtbj2di	15022 GIN FLAME PASSION PINK CL70 0,70 BOT 1 26,40		L	\N	2025-11-25 14:59:36.83	2025-11-25 14:59:36.83	\N
knmr7qnnvyb65rzpulbmggdi	xxevpbrra70t4616xwtbj2di	14249 GIN GORDON S DRY DIAGEO LITRO 1,00 BOT 1 13,13		PIECE	\N	2025-11-25 14:59:37.536	2025-11-25 14:59:37.536	\N
zmzl5rujpdlb9uq809bqps12	xxevpbrra70t4616xwtbj2di	14935 GIN GORDON S SICILY LEMON CL70 0,70 BOT 1 12,60		L	\N	2025-11-25 14:59:38.176	2025-11-25 14:59:38.176	\N
nz44v0jn8ydrhk3cii1q62cl	xxevpbrra70t4616xwtbj2di	14760 GIN GORDONS PINK CL70 0,70 BOT 1 13,35		L	\N	2025-11-25 14:59:38.81	2025-11-25 14:59:38.81	\N
xq892p39784ntf532muiur4i	xxevpbrra70t4616xwtbj2di	15026 GIN GREENALL LT 1 1,00 BOT 1 12,53		PIECE	\N	2025-11-25 14:59:39.457	2025-11-25 14:59:39.457	\N
w5acz0adcz1lxpd3veixpohu	xxevpbrra70t4616xwtbj2di	14832 GIN GRIFU PILLONI CL 70 0,70 BOT 1 26,25		L	\N	2025-11-25 14:59:40.09	2025-11-25 14:59:40.09	\N
cba9u2xonwdg9rsjp8c8ks45	xxevpbrra70t4616xwtbj2di	14137 GIN G'VINE FLORAISON CL.70 0,70 BOT 1 31,95		L	\N	2025-11-25 14:59:40.731	2025-11-25 14:59:40.731	\N
osviylmksb4t5dfl8lb9kltx	xxevpbrra70t4616xwtbj2di	14480 GIN HENDRICK'S *70 0,70 BOT 1 29,70		L	\N	2025-11-25 14:59:41.371	2025-11-25 14:59:41.371	\N
jesavo21hlq1ek3day9t2eag	xxevpbrra70t4616xwtbj2di	14485 GIN HENDRICK'S GRAND CABARET  *70 0,70 BOT 1 42,00		L	\N	2025-11-25 14:59:42.022	2025-11-25 14:59:42.022	\N
h3qiq4kem8dmh57elddmc2sq	xxevpbrra70t4616xwtbj2di	14963 GIN HENDRICK'S NEPTUNIA CL 70 0,70 BOT 1 41,40		L	\N	2025-11-25 14:59:42.659	2025-11-25 14:59:42.659	\N
op18t9jxykksnodje9im0to7	xxevpbrra70t4616xwtbj2di	14672 GIN JINZU CL.70 0,70 BOT 1 35,70		L	\N	2025-11-25 14:59:43.301	2025-11-25 14:59:43.301	\N
oghxgbil53py5mvyg41p8qud	xxevpbrra70t4616xwtbj2di	15117 GIN JODHPUR BAORI CL 70 0,70 BOT 1 28,20		L	\N	2025-11-25 14:59:43.951	2025-11-25 14:59:43.951	\N
vub6m66hh0zn236q2lems5ir	xxevpbrra70t4616xwtbj2di	15084 GIN JODHPUR DRY CL 70 0,70 BOT 1 24,45		L	\N	2025-11-25 14:59:44.582	2025-11-25 14:59:44.582	\N
q8r9llsple7cmb7uc2w0e3ef	xxevpbrra70t4616xwtbj2di	15087 GIN JODHPUR MANDORE CL 70 0,70 BOT 1 28,20		L	\N	2025-11-25 14:59:45.217	2025-11-25 14:59:45.217	\N
ukj8lpqtskeai5522wrcimas	xxevpbrra70t4616xwtbj2di	15085 GIN JODHPUR RISERVE CL 50 0,50 BOT 1 37,88		L	\N	2025-11-25 14:59:45.864	2025-11-25 14:59:45.864	\N
xuekwuonbdvx2mrsb6s12wka	xxevpbrra70t4616xwtbj2di	15086 GIN JODHPUR SPICY CL 70 0,70 BOT 1 28,20		L	\N	2025-11-25 14:59:46.51	2025-11-25 14:59:46.51	\N
k8tbxve7b3crg6zxuyil2qp1	xxevpbrra70t4616xwtbj2di	14661 GIN LONDON DRY N.3 CL 70 0,70 BOT 1 33,75		L	\N	2025-11-25 14:59:47.144	2025-11-25 14:59:47.144	\N
oncmqvafcqf69wdudqvxcc53	xxevpbrra70t4616xwtbj2di	14635 GIN LONDON N.1 LT 1 1,00 BOT 1 31,13		L	\N	2025-11-25 14:59:47.786	2025-11-25 14:59:47.786	\N
ga005dqydb7roi3v2n8x4msn	xxevpbrra70t4616xwtbj2di	15088 GIN MAIOR SUAU CL 70 0,70 BOT 1 31,50		L	\N	2025-11-25 14:59:48.461	2025-11-25 14:59:48.461	\N
cbqfyf41dfuwwgaiy1767uqg	xxevpbrra70t4616xwtbj2di	14583 GIN MARE "CAPRI" CL.70 0,70 BOT 1 37,50		L	\N	2025-11-25 14:59:49.099	2025-11-25 14:59:49.099	\N
y8zk80c40iolbpv4bvqqs3io	xxevpbrra70t4616xwtbj2di	14086 GIN MARE CL.70 0,70 BOT 1 30,75		L	\N	2025-11-25 14:59:49.735	2025-11-25 14:59:49.735	\N
wwv6y3sdb4wcq2t01m9u50g4	xxevpbrra70t4616xwtbj2di	15123 GIN MARE LT 1 1,00 BOT 1 52,50		PIECE	\N	2025-11-25 14:59:50.377	2025-11-25 14:59:50.377	\N
p5gsty2e8ad3fm8mn68rbk51	xxevpbrra70t4616xwtbj2di	14154 GIN MARTIN MILLERS CL 70 0,70 BOT 1 28,28		L	\N	2025-11-25 14:59:51.013	2025-11-25 14:59:51.013	\N
wm3uh4ocspwhzisb85b0m7zv	xxevpbrra70t4616xwtbj2di	15021 GIN MAYFAIR HIGH TEA CL 70 0,70 BOT 1 23,40		L	\N	2025-11-25 14:59:51.658	2025-11-25 14:59:51.658	\N
hzmhps1xi5e2h385szvnl507	xxevpbrra70t4616xwtbj2di	14193 GIN MOMBASA DRY CL 70 0,70 BOT 1 30,75		L	\N	2025-11-25 14:59:52.3	2025-11-25 14:59:52.3	\N
f59l1brye4c3uhzb3kbj9r7j	xxevpbrra70t4616xwtbj2di	14152 GIN MONKEY 47 CL 50 0,50 BOT 1 39,75		L	\N	2025-11-25 14:59:53.005	2025-11-25 14:59:53.005	\N
zdji32nxv0lpkzopyj8gqly3	xxevpbrra70t4616xwtbj2di	14912 GIN NORDES CL 70 0,70 BOT 1 29,40		L	\N	2025-11-25 14:59:53.642	2025-11-25 14:59:53.642	\N
w3hgvrx6bmszeeszn0cnlh4y	xxevpbrra70t4616xwtbj2di	14068 GIN OLD ENGLISH CL 70 0,70 BOT 1 30,68		L	\N	2025-11-25 14:59:54.282	2025-11-25 14:59:54.282	\N
ceurpiiq8edxjnqwx7vtoe51	xxevpbrra70t4616xwtbj2di	14729 GIN ONDINA CL.70 0,70 BOT 1 33,38		L	\N	2025-11-25 14:59:54.917	2025-11-25 14:59:54.917	\N
le2unocd0uc8qvhdh3ytc0yj	xxevpbrra70t4616xwtbj2di	14120 GIN OPIHR CL 70 0,70 BOT 1 19,80		L	\N	2025-11-25 14:59:55.557	2025-11-25 14:59:55.557	\N
fg66ho5xpt6xjq5tw5wucqef	xxevpbrra70t4616xwtbj2di	14833 GIN PIG SKIN  CL 70 0,70 BOT 1 20,03		L	\N	2025-11-25 14:59:56.201	2025-11-25 14:59:56.201	\N
s6ber90d5x4io7zwu1km1xd4	xxevpbrra70t4616xwtbj2di	14518 GIN PLAYMOUTH LT 1,00 BOT 1 35,25		PIECE	\N	2025-11-25 14:59:56.836	2025-11-25 14:59:56.836	\N
rt9atq268wl0iudws9dbakdl	xxevpbrra70t4616xwtbj2di	14885 GIN PORTOBELLO ROAD CL 70 0,70 BOT 1 23,40		L	\N	2025-11-25 14:59:57.484	2025-11-25 14:59:57.484	\N
brj405fwcshotxslcyz0b4ix	xxevpbrra70t4616xwtbj2di	14930 GIN PORTOFINO CL 50 0,50 BOT 1 42,00		L	\N	2025-11-25 14:59:58.12	2025-11-25 14:59:58.12	\N
qynuukauq1u71ffj3xcn49ew	xxevpbrra70t4616xwtbj2di	14087 GIN PURO CL.70 0,70 BOT 1 28,50		L	\N	2025-11-25 14:59:58.755	2025-11-25 14:59:58.755	\N
gvts4v6e5u2ksi1guw7f9azl	xxevpbrra70t4616xwtbj2di	14813 GIN ROKU CL 70 0,70 BOT 1 26,63		L	\N	2025-11-25 14:59:59.391	2025-11-25 14:59:59.391	\N
ilpi3pvhn8e96wfj4xa28fhk	xxevpbrra70t4616xwtbj2di	14737 GIN SABATINI CL 70 0,70 BOT 1 35,85		L	\N	2025-11-25 15:00:00.024	2025-11-25 15:00:00.024	\N
vq2fbrdtmou2uxgoglebgb6q	xxevpbrra70t4616xwtbj2di	15048 GIN SAFFRON CL 70 0,70 BOT 1 32,03		L	\N	2025-11-25 15:00:00.689	2025-11-25 15:00:00.689	\N
iwn3xjrgsax8pdkxu3moy7fp	xxevpbrra70t4616xwtbj2di	15063 GIN SCAPEGRACE BLACK CL 70 (VIOLA) 0,70 BOT 1 39,30		L	\N	2025-11-25 15:00:01.335	2025-11-25 15:00:01.335	\N
mtaop46wwdczyw3375go42ke	xxevpbrra70t4616xwtbj2di	14377 GIN SEVI DRY CL 50 0,50 BOT 1 28,65		L	\N	2025-11-25 15:00:01.974	2025-11-25 15:00:01.974	\N
fopx8n2ekbl4e29nv1bchi5p	xxevpbrra70t4616xwtbj2di	14379 GIN SEVI NAVY STRENGTH CL 50 0,50 BOT 1 31,50		L	\N	2025-11-25 15:00:02.708	2025-11-25 15:00:02.708	\N
l4ahl0oz9a0rwkub87gcsvpm	xxevpbrra70t4616xwtbj2di	14738 GIN SIPSMITH LONDON DRY CL 70 0,70 BOT 1 33,00		L	\N	2025-11-25 15:00:03.345	2025-11-25 15:00:03.345	\N
qv7glg9dmahd3p5ufd171mf3	xxevpbrra70t4616xwtbj2di	15020 GIN SOERO CL 50 0,50 BOT 1 31,28		L	\N	2025-11-25 15:00:03.977	2025-11-25 15:00:03.977	\N
o9fl3376kwfz9u0c9a9qibxg	xxevpbrra70t4616xwtbj2di	15027 GIN TANQUERAY 0.0. no alcool  CL 70 0,70 BOT 1 14,25		L	\N	2025-11-25 15:00:04.619	2025-11-25 15:00:04.619	\N
zuvslsec6gzhso8t3yx9scve	xxevpbrra70t4616xwtbj2di	14232 GIN TANQUERAY CL.70 0,70 BOT 1 15,60		L	\N	2025-11-25 15:00:05.255	2025-11-25 15:00:05.255	\N
ig5ivq6a1jlx8ni40nng7y5z	xxevpbrra70t4616xwtbj2di	14337 GIN TANQUERAY LT 1 1,00 BOT 1 20,70		L	\N	2025-11-25 15:00:05.898	2025-11-25 15:00:05.898	\N
tb480o6799j7gmk8cj0wu81s	xxevpbrra70t4616xwtbj2di	14654 GIN TANQUERAY RANGPUR CL.70 0,70 BOT 1 25,13		L	\N	2025-11-25 15:00:06.537	2025-11-25 15:00:06.537	\N
ausigg5uzijiv44kjcl4a6hn	xxevpbrra70t4616xwtbj2di	14810 GIN TANQUERAY SEVILLA CL.70 0,70 BOT 1 23,18		L	\N	2025-11-25 15:00:07.169	2025-11-25 15:00:07.169	\N
e55vxytex8sj7ciql5fe7vsx	xxevpbrra70t4616xwtbj2di	14645 GIN TANQUERAY TEN LT 1 1,00 BOT 1 37,80		PIECE	\N	2025-11-25 15:00:07.88	2025-11-25 15:00:07.88	\N
z5rlyfsbdmjfgsr6d00gh1ih	xxevpbrra70t4616xwtbj2di	14167 GIN UNGAVA CL 70 0,70 BOT 1 29,70		L	\N	2025-11-25 15:00:08.514	2025-11-25 15:00:08.514	\N
ry0h311cwz0rynfo3lapl6yt	xxevpbrra70t4616xwtbj2di	14822 GIN VILLA ASCENTI CL.70 0,70 BOT 1 40,20		L	\N	2025-11-25 15:00:09.152	2025-11-25 15:00:09.152	\N
grlop2gp7epzwhso6ylstifs	xxevpbrra70t4616xwtbj2di	14846 GIN WHITMAN LT 1 1,00 BOT 1 9,23		PIECE	\N	2025-11-25 15:00:09.793	2025-11-25 15:00:09.793	\N
gxdab68l6ofg73cr882qv5fq	xxevpbrra70t4616xwtbj2di	15125 GINARTE CL 70 0,70 BOT 1 31,28		L	\N	2025-11-25 15:00:10.444	2025-11-25 15:00:10.444	\N
ch70hlh1yyhry0viq86wj3tj	xxevpbrra70t4616xwtbj2di	14238 GRAPPA  903 BARRIQUE CL 70 0,70 BOT 1 18,38		L	\N	2025-11-25 15:00:11.083	2025-11-25 15:00:11.083	\N
xq5vvvjn61demtwt8bzg2kyt	xxevpbrra70t4616xwtbj2di	14546 GRAPPA 903 BARRIQUE LT 3 3,00 BOT 1 60,75		L	\N	2025-11-25 15:00:11.733	2025-11-25 15:00:11.733	\N
kz6dldyng3nmtg3vz8pphyiu	xxevpbrra70t4616xwtbj2di	14066 GRAPPA 903 TIPICA BIANCA CL 70 0,70 BOT 1 18,90		L	\N	2025-11-25 15:00:12.468	2025-11-25 15:00:12.468	\N
o805iy7aiv0lwi45s4w572dv	xxevpbrra70t4616xwtbj2di	15139 GRAPPA BARRICATA 966 DI CICCO LT 2 2,00 BOT 1 19,13		PIECE	\N	2025-11-25 15:00:13.122	2025-11-25 15:00:13.122	\N
gdnqgxq9fkz9cotefqpkabzm	xxevpbrra70t4616xwtbj2di	15045 GRAPPA BASSANO 24 CARATI CL 70 0,70 BOT 1 15,53		L	\N	2025-11-25 15:00:13.774	2025-11-25 15:00:13.774	\N
tao2tip0z9wz6o36vrrj5x4p	xxevpbrra70t4616xwtbj2di	14468 GRAPPA BERTA BRIC DEL GAIAN CONF.REG. 0,70 BOT 1 90,75		L	\N	2025-11-25 15:00:14.423	2025-11-25 15:00:14.423	\N
vrcvekxjw4hawd327s9zfdf1	xxevpbrra70t4616xwtbj2di	14808 GRAPPA BERTA ELISI CL 50 0,50 BOT 1 23,25		L	\N	2025-11-25 15:00:15.062	2025-11-25 15:00:15.062	\N
t68153rlidi00kn7ujk9v91c	xxevpbrra70t4616xwtbj2di	14534 GRAPPA BERTA MAGIA CONF.R.*70 0,70 BOT 1 108,53		L	\N	2025-11-25 15:00:15.733	2025-11-25 15:00:15.733	\N
d8pkewc83cxz4419wqc280j8	xxevpbrra70t4616xwtbj2di	14191 GRAPPA BERTA PIASI' CL 70 0,70 BOT 1 23,63		L	\N	2025-11-25 15:00:16.375	2025-11-25 15:00:16.375	\N
i8h7fexp2sjfrt9p6mp4umr8	xxevpbrra70t4616xwtbj2di	14467 GRAPPA BERTA RDF PAOLO COFANETTO CL70 0,70 BOT 1 153,75		L	\N	2025-11-25 15:00:17.009	2025-11-25 15:00:17.009	\N
hmhkoydknrqurnhfvoxb9mgk	xxevpbrra70t4616xwtbj2di	14466 GRAPPA BERTA TRESOLI TRE CONF.REG. 0,70 BOT 1 90,75		L	\N	2025-11-25 15:00:17.645	2025-11-25 15:00:17.645	\N
j9pksnu8bw5tylmn9llnd9yk	xxevpbrra70t4616xwtbj2di	14464 GRAPPA BERTA VILLAPRATO BIANCA  CL.100 1,00 BOT 1 24,53		PIECE	\N	2025-11-25 15:00:18.281	2025-11-25 15:00:18.281	\N
em845qcuyqtpw9zyfkeq3sju	xxevpbrra70t4616xwtbj2di	14462 GRAPPA BERTA VILLAPRATO INVECC HIATA LT 1 1,00 BOT 1 24,53		PIECE	\N	2025-11-25 15:00:18.927	2025-11-25 15:00:18.927	\N
eg6jou2unshfi7rkyn6l3wux	xxevpbrra70t4616xwtbj2di	15143 GRAPPA BIANCA DI CICCO 2 LT 2,00 BOT 1 16,88		PIECE	\N	2025-11-25 15:00:19.578	2025-11-25 15:00:19.578	\N
xy7hm9v5fiuuwvc1sto7qq1s	xxevpbrra70t4616xwtbj2di	14286 GRAPPA CANDOLINI BIANCA 40 LT.  1 1,00 BOT 1 14,55		PIECE	\N	2025-11-25 15:00:20.216	2025-11-25 15:00:20.216	\N
tffrj71cz3fybma9da10ufm6	xxevpbrra70t4616xwtbj2di	14313 GRAPPA FRATTINA CHARDONNAY CL.  70 0,70 BOT 1 12,75		L	\N	2025-11-25 15:00:20.858	2025-11-25 15:00:20.858	\N
l7ixz9lckrbbws7gib188aow	xxevpbrra70t4616xwtbj2di	14322 GRAPPA MARZADRO "LE DICIOTTO" LUNE CL 70 0,70 BOT 1 27,60		L	\N	2025-11-25 15:00:21.501	2025-11-25 15:00:21.501	\N
oyezvhh7y59mk33xp7omsis8	xxevpbrra70t4616xwtbj2di	14567 GRAPPA MAZZETTI 3.0 INV. LT 1 BARRIQUE 1,00 BOT 1 18,90		PIECE	\N	2025-11-25 15:00:22.141	2025-11-25 15:00:22.141	\N
ppbe43vb8rmq9lkc8xyoyp9c	xxevpbrra70t4616xwtbj2di	14213 GRAPPA MAZZETTI 7.0 RUCHE' BAR RIC. CL 70 0,70 BOT 1 24,15		L	\N	2025-11-25 15:00:22.777	2025-11-25 15:00:22.777	\N
fwgn1u19uwmof7duwzqiwj3t	xxevpbrra70t4616xwtbj2di	14553 GRAPPA MAZZETTI C.LEGNO RIS AL BA CL 70 0,70 BOT 1 45,45		L	\N	2025-11-25 15:00:23.501	2025-11-25 15:00:23.501	\N
rgotd1poiocwb8at456fnlo6	xxevpbrra70t4616xwtbj2di	14554 GRAPPA MAZZETTI C.LEGNO RIS GA IA CL 70 0,70 BOT 1 45,45		L	\N	2025-11-25 15:00:24.134	2025-11-25 15:00:24.134	\N
dpa3jmc9oxqhnofsbkyfwit1	xxevpbrra70t4616xwtbj2di	14566 GRAPPA MAZZETTI MORB.BIANCA LT 1 1,00 BOT 1 17,33		PIECE	\N	2025-11-25 15:00:24.781	2025-11-25 15:00:24.781	\N
gwdlqh5f2j52m5wky6e9njx3	xxevpbrra70t4616xwtbj2di	14835 GRAPPA MAZZETTI ORO CL 50 0,50 BOT 1 21,75		L	\N	2025-11-25 15:00:25.416	2025-11-25 15:00:25.416	\N
fjq5na5gu9z2ic7xyvfv987w	xxevpbrra70t4616xwtbj2di	14274 GRAPPA NARDINI BIANCA LT 1 1,00 BOT 1 21,98		PIECE	\N	2025-11-25 15:00:26.056	2025-11-25 15:00:26.056	\N
h7x6xxrwuou4ha9fl3drb1uc	xxevpbrra70t4616xwtbj2di	14556 GRAPPA OPPIDUM S.ANDREA B.CA CL 70 0,70 BOT 1 19,50		L	\N	2025-11-25 15:00:26.688	2025-11-25 15:00:26.688	\N
ctjrm40io50ghp9p4lyzq76r	xxevpbrra70t4616xwtbj2di	14555 GRAPPA PETIT VERDOT C.GIGLIO C L 70 0,70 BOT 1 20,25		L	\N	2025-11-25 15:00:27.336	2025-11-25 15:00:27.336	\N
sg1dhrda1hscz3pwoivoy8le	xxevpbrra70t4616xwtbj2di	15046 GRAPPA POLI SASSICAIA CL 50 0,50 BOT 1 72,75		L	\N	2025-11-25 15:00:27.97	2025-11-25 15:00:27.97	\N
weihvn5rofq9zp637piwgsom	xxevpbrra70t4616xwtbj2di	14275 GRAPPA PRIME UVE BIANCHE MASCHIO CL. 70 0,70 BOT 1 24,83		L	\N	2025-11-25 15:00:28.611	2025-11-25 15:00:28.611	\N
ddanr8k4fwphcowu23vr1805	xxevpbrra70t4616xwtbj2di	14276 GRAPPA PRIME UVE NERE MASCHIO CL. 70 0,70 BOT 1 25,95		L	\N	2025-11-25 15:00:29.244	2025-11-25 15:00:29.244	\N
lvboo92t7vuni4szulzgvk7q	xxevpbrra70t4616xwtbj2di	14539 GRAPPA RIS.BARRIC. VARVAGLIONE CL 70 0,70 BOT 1 45,00		L	\N	2025-11-25 15:00:29.879	2025-11-25 15:00:29.879	\N
ij9hrj5xth6apxmcmw4scbpj	xxevpbrra70t4616xwtbj2di	14598 GRAPPA WILLIAMS PERE CL 70 0,70 BOT 1 14,63		L	\N	2025-11-25 15:00:30.525	2025-11-25 15:00:30.525	\N
zhwlj15y0ngwu3or29tzxvhy	xxevpbrra70t4616xwtbj2di	14277 VODKA ABSOLUT CL.100 1,00 BOT 1 18,90		PIECE	\N	2025-11-25 15:00:31.169	2025-11-25 15:00:31.169	\N
warazrp8wd6xepxwef2ewns5	xxevpbrra70t4616xwtbj2di	14077 VODKA ABSOLUT CL.150 1,50 BOT 1 29,03		L	\N	2025-11-25 15:00:31.806	2025-11-25 15:00:31.806	\N
a0enniyyo16lwxca1kmhtcdv	xxevpbrra70t4616xwtbj2di	14257 VODKA ABSOLUT CL.70 0,70 BOT 1 14,63		L	\N	2025-11-25 15:00:32.443	2025-11-25 15:00:32.443	\N
xvpdjxnh4no064s7r5pfetyg	xxevpbrra70t4616xwtbj2di	14050 VODKA ABSOLUT ELYX 2.0 CL70 0,70 BOT 1 45,00		L	\N	2025-11-25 15:00:33.079	2025-11-25 15:00:33.079	\N
la17njkbnh8caou80hdqggwe	xxevpbrra70t4616xwtbj2di	14328 VODKA ABSOLUT PEARS LT 1,00 BOT 1 18,75		PIECE	\N	2025-11-25 15:00:33.767	2025-11-25 15:00:33.767	\N
h4kn77bpz8wm0qyqmut6j9sn	xxevpbrra70t4616xwtbj2di	14199 VODKA ABSOLUT RASPBERRY LT 1 1,00 BOT 1 18,75		PIECE	\N	2025-11-25 15:00:34.406	2025-11-25 15:00:34.406	\N
vhy4tx55p1d4pniufc0v6dk3	xxevpbrra70t4616xwtbj2di	14327 VODKA ABSOLUT RUBY RED LT 1,00 BOT 1 18,75		PIECE	\N	2025-11-25 15:00:35.045	2025-11-25 15:00:35.045	\N
ihgiarludqtyi66sg79xnxxm	xxevpbrra70t4616xwtbj2di	14316 VODKA ABSOLUT VANILLA LT 1,00 BOT 1 18,75		PIECE	\N	2025-11-25 15:00:35.689	2025-11-25 15:00:35.689	\N
dy03c4ogvt10j6igzgc2oyuu	xxevpbrra70t4616xwtbj2di	14339 VODKA ARTIC FRAGOLA LT 1 1,00 BOT 1 9,90		PIECE	\N	2025-11-25 15:00:36.327	2025-11-25 15:00:36.327	\N
vn44hh94pc7jgnpgyec094dz	xxevpbrra70t4616xwtbj2di	14122 VODKA ARTIC LIMONE LT.1 1,00 BOT 1 9,90		PIECE	\N	2025-11-25 15:00:36.97	2025-11-25 15:00:36.97	\N
weqxjxb2kv5a0dsmq92xhb0c	xxevpbrra70t4616xwtbj2di	14082 VODKA ARTIC MELA VERDE LT 1 1,00 BOT 1 9,90		PIECE	\N	2025-11-25 15:00:37.661	2025-11-25 15:00:37.661	\N
ggowohd3ihrzysz2fk4m88xm	xxevpbrra70t4616xwtbj2di	14342 VODKA ARTIC MELONE LT 1 1,00 BOT 1 9,90		PIECE	\N	2025-11-25 15:00:38.377	2025-11-25 15:00:38.377	\N
zl3pxuowk6fphesbs4i1ac7y	xxevpbrra70t4616xwtbj2di	14338 VODKA ARTIC PESCA LT 1 1,00 BOT 1 9,90		PIECE	\N	2025-11-25 15:00:39.035	2025-11-25 15:00:39.035	\N
ak6zhbjt3p5wy2l41l323gh6	xxevpbrra70t4616xwtbj2di	15112 VODKA BELOW 42     LT 1 1,00 BOT 1 18,75		PIECE	\N	2025-11-25 15:00:39.672	2025-11-25 15:00:39.672	\N
h5krhwvimolsh71szjof6gzt	xxevpbrra70t4616xwtbj2di	14670 VODKA BELOW 42 CL 70 0,70 BOT 1 13,95		L	\N	2025-11-25 15:00:40.316	2025-11-25 15:00:40.316	\N
nt23gghlrnmac42zl419e59g	xxevpbrra70t4616xwtbj2di	14018 VODKA BELUGA SILVER LT 1,00 BOT 1 42,38		PIECE	\N	2025-11-25 15:00:40.948	2025-11-25 15:00:40.948	\N
gltwv74yoe2n3d1hskaycbsd	xxevpbrra70t4616xwtbj2di	14360 VODKA BELVEDERE CL70 0,70 BOT 1 36,15		L	\N	2025-11-25 15:00:41.584	2025-11-25 15:00:41.584	\N
sn0wwxa3lu4wqnhkgy8ws25d	xxevpbrra70t4616xwtbj2di	14091 VODKA BELVEDERE LT 1.75 1,75 BOT 1 117,75		PIECE	\N	2025-11-25 15:00:42.218	2025-11-25 15:00:42.218	\N
hlav3i1hdy4kkbounqwd9382	xxevpbrra70t4616xwtbj2di	14579 VODKA CIROC CL.70 0,70 BOT 1 33,75		L	\N	2025-11-25 15:00:42.857	2025-11-25 15:00:42.857	\N
akjqlojs9y2e4a2k39eu730x	xxevpbrra70t4616xwtbj2di	14665 VODKA CIROC LT 1.75 1,75 BOT 1 75,75		PIECE	\N	2025-11-25 15:00:43.519	2025-11-25 15:00:43.519	\N
ziiqutpp6aa31c59t49rjsd6	xxevpbrra70t4616xwtbj2di	15141 VODKA DI CICCO 2 LT 2,00 BOT 1 14,85		PIECE	\N	2025-11-25 15:00:44.156	2025-11-25 15:00:44.156	\N
dlohzek68m6ue6jb7gewjcyr	xxevpbrra70t4616xwtbj2di	15031 VODKA ERISTOFF CL 70 0,70 BOT 1 8,55		L	\N	2025-11-25 15:00:44.869	2025-11-25 15:00:44.869	\N
aixv0xs9wclkqwajna8jmwz1	xxevpbrra70t4616xwtbj2di	14915 VODKA ERISTOFF CL.100 1,00 BOT 1 11,10		PIECE	\N	2025-11-25 15:00:45.508	2025-11-25 15:00:45.508	\N
i9gv0mljajdwgxpt5usqjo9w	xxevpbrra70t4616xwtbj2di	14058 VODKA FINLANDIA LT 1,00 BOT 1 13,13		PIECE	\N	2025-11-25 15:00:46.149	2025-11-25 15:00:46.149	\N
ngbt95scjx55kz9vrhunolj7	xxevpbrra70t4616xwtbj2di	14357 VODKA GREYGOOSE CL70 0,70 BOT 1 36,00		L	\N	2025-11-25 15:00:46.782	2025-11-25 15:00:46.782	\N
h0gi4893btos6krc7be30vo9	xxevpbrra70t4616xwtbj2di	14529 VODKA GREYGOOSE LT 6 6,00 BOT 1 487,50		PIECE	\N	2025-11-25 15:00:47.42	2025-11-25 15:00:47.42	\N
us2opiem5ru7x7kuznzs530g	xxevpbrra70t4616xwtbj2di	14063 VODKA GREYGOOSE LT1.5 1,50 BOT 1 99,75		L	\N	2025-11-25 15:00:48.052	2025-11-25 15:00:48.052	\N
qm7jslhuarngylnb2tysfwkx	xxevpbrra70t4616xwtbj2di	14608 VODKA JANOKA LT 1 1,00 BOT 1 8,63		PIECE	\N	2025-11-25 15:00:48.686	2025-11-25 15:00:48.686	\N
f650cm6nb7chamb7uv77ol32	xxevpbrra70t4616xwtbj2di	14153 VODKA KAUFFMANN CL 70 0,70 BOT 1 51,00		L	\N	2025-11-25 15:00:49.321	2025-11-25 15:00:49.321	\N
lcczjo5prlmcxikse8trv1cn	xxevpbrra70t4616xwtbj2di	14824 VODKA KAUFFMANN HARD CL 70 0,70 BOT 1 51,00		L	\N	2025-11-25 15:00:49.956	2025-11-25 15:00:49.956	\N
v2yru89lq2qcl5n36voiybzg	xxevpbrra70t4616xwtbj2di	15138 VODKA KEGLEVICH BIANCA LT 1,00 BOT 1 11,63		PIECE	\N	2025-11-25 15:00:50.588	2025-11-25 15:00:50.588	\N
pl434b4i51ecg31i6ghfbpny	xxevpbrra70t4616xwtbj2di	14563 VODKA KEGLEVICH FRAGOLA LT 1 1,00 BOT 1 12,98		PIECE	\N	2025-11-25 15:00:51.222	2025-11-25 15:00:51.222	\N
g7j9lsp3bwrmywxeosiljajs	xxevpbrra70t4616xwtbj2di	15136 VODKA KEGLEVICH MELONE CL 70 1,00 BOT 1 9,75		PIECE	\N	2025-11-25 15:00:51.856	2025-11-25 15:00:51.856	\N
djueqo456ohhdftzkm1o5tqf	xxevpbrra70t4616xwtbj2di	14564 VODKA KEGLEVICH MELONE LT 1 1,00 BOT 1 12,98		PIECE	\N	2025-11-25 15:00:52.502	2025-11-25 15:00:52.502	\N
fjo47vnuts17cg5sa3xxmv5x	xxevpbrra70t4616xwtbj2di	15137 VODKA KEGLEVICH PESCA LT 1,00 BOT 1 12,98		PIECE	\N	2025-11-25 15:00:53.137	2025-11-25 15:00:53.137	\N
c8wh5m34g0eti82osqyt4q35	xxevpbrra70t4616xwtbj2di	14721 VODKA KETEL ONE LT 1 1,00 BOT 1 25,88		PIECE	\N	2025-11-25 15:00:53.839	2025-11-25 15:00:53.839	\N
vfp0844zlegfygmlb4qinrmb	xxevpbrra70t4616xwtbj2di	14544 VODKA MOSCOWSKAYA 38 CL100 1,00 BOT 1 13,50		PIECE	\N	2025-11-25 15:00:54.478	2025-11-25 15:00:54.478	\N
f62lo78bl36j739g3dyetzae	xxevpbrra70t4616xwtbj2di	14172 VODKA POLUGAR CLASSIC RYE CL 70 0,70 BOT 1 66,00		L	\N	2025-11-25 15:00:55.113	2025-11-25 15:00:55.113	\N
vbe2obzrjg4o3ysgrf86q3c4	xxevpbrra70t4616xwtbj2di	14160 VODKA POTOCKI CL 70 0,70 BOT 1 42,75		L	\N	2025-11-25 15:00:55.756	2025-11-25 15:00:55.756	\N
jmzki4w0caw1enkclrw1oygx	xxevpbrra70t4616xwtbj2di	14158 VODKA PURITY AST. CL 70 0,70 BOT 1 42,75		L	\N	2025-11-25 15:00:56.393	2025-11-25 15:00:56.393	\N
yjjs33shdhr3pid23mhfw8a3	xxevpbrra70t4616xwtbj2di	15064 VODKA SERNOVA CL.70 0,70 BOT 1 34,58		L	\N	2025-11-25 15:00:57.028	2025-11-25 15:00:57.028	\N
nydstzzrq48z6wi44l2b5u03	xxevpbrra70t4616xwtbj2di	14828 VODKA SKYY 6 LT 6,00 BOT 1 129,75		PIECE	\N	2025-11-25 15:00:57.661	2025-11-25 15:00:57.661	\N
yatrv9ngmtxxl4w6j7yed591	xxevpbrra70t4616xwtbj2di	14693 VODKA SKYY 90  CL 70 0,70 BOT 1 34,50		L	\N	2025-11-25 15:00:58.305	2025-11-25 15:00:58.305	\N
sd84xvb3281vu08hdb136xoq	xxevpbrra70t4616xwtbj2di	14527 VODKA SKYY BIANCA  LT 1,00 BOT 1 11,70		PIECE	\N	2025-11-25 15:00:58.943	2025-11-25 15:00:58.943	\N
on0ryqayxt3dmw5mkp2n2q68	xxevpbrra70t4616xwtbj2di	14235 VODKA SMIRNOFF RED 37.5 CL.100*1 1,00 BOT 1 11,63		PIECE	\N	2025-11-25 15:00:59.579	2025-11-25 15:00:59.579	\N
c4ow2h64us3nt1f4kha8hgzl	xxevpbrra70t4616xwtbj2di	14671 VODKA STOLICHNAYA ELITE CL 70 0,70 BOT 1 38,25		L	\N	2025-11-25 15:01:00.223	2025-11-25 15:01:00.223	\N
rjyh9ucr9imezl9s5gim7kyj	xxevpbrra70t4616xwtbj2di	14441 VODKA STOLICHNAYA LT 1,00 BOT 1 16,65		PIECE	\N	2025-11-25 15:01:00.858	2025-11-25 15:01:00.858	\N
q6q386nkda3z8cv125oi34in	xxevpbrra70t4616xwtbj2di	14668 VODKA TITO'S HANDMADE CL 70 0,70 BOT 1 22,65		L	\N	2025-11-25 15:01:01.508	2025-11-25 15:01:01.508	\N
ayfjquw1dbzklsqzet96qmjy	xxevpbrra70t4616xwtbj2di	14303 VODKA WIBOROWA LT 1,00 BOT 1 11,93		PIECE	\N	2025-11-25 15:01:02.14	2025-11-25 15:01:02.14	\N
x5nk7wq9uvo4hxo05eddff3d	xxevpbrra70t4616xwtbj2di	14115 VODKA ZUBROWKA CL 100 1,00 BOT 1 16,35		PIECE	\N	2025-11-25 15:01:02.777	2025-11-25 15:01:02.777	\N
vxzaoeqpb795o242skrbckda	xxevpbrra70t4616xwtbj2di	14025 RUM AGRIC. S.J.AMBRE' CL 70 0,70 BOT 1 13,28		L	\N	2025-11-25 15:01:03.411	2025-11-25 15:01:03.411	\N
uaegijkvif2ffhsrhscxebda	xxevpbrra70t4616xwtbj2di	14069 RUM APPLETON 21Y CL70 0,70 BOT 1 123,75		L	\N	2025-11-25 15:01:04.049	2025-11-25 15:01:04.049	\N
aj2gwkvv71x7qh4nipnvkqum	xxevpbrra70t4616xwtbj2di	14099 RUM APPLETON EST. 8Y RES.BLEND CL.70 0,70 BOT 1 24,98		L	\N	2025-11-25 15:01:04.683	2025-11-25 15:01:04.683	\N
jz9p1yu9rvjaxio10fc27lel	xxevpbrra70t4616xwtbj2di	14283 RUM BACARDI BIANCO SUPER CL. 100 1,00 BOT 1 15,23		PIECE	\N	2025-11-25 15:01:05.322	2025-11-25 15:01:05.322	\N
xmwyohd5cjwm5yeamphzo15o	xxevpbrra70t4616xwtbj2di	14921 RUM BACARDI OCHO RIS. CL 70 0,70 BOT 1 27,00		L	\N	2025-11-25 15:01:05.955	2025-11-25 15:01:05.955	\N
rzunnnkwepxu0swmfoklieks	xxevpbrra70t4616xwtbj2di	14516 RUM BACARDI ORO LT 1,00 BOT 1 16,65		PIECE	\N	2025-11-25 15:01:06.594	2025-11-25 15:01:06.594	\N
hdu2ecrx7invu3srlcxtekc8	xxevpbrra70t4616xwtbj2di	15052 RUM BARON SAMEDI' CL 70 0,70 BOT 1 17,10		L	\N	2025-11-25 15:01:07.259	2025-11-25 15:01:07.259	\N
nadi6j3jo3ie5t9a1vofaw95	xxevpbrra70t4616xwtbj2di	15140 RUM BIANCO DI CICCO 2 LT 2,00 BOT 1 14,85		PIECE	\N	2025-11-25 15:01:07.892	2025-11-25 15:01:07.892	\N
mcffdc4fm3gwg10q5pngzmta	xxevpbrra70t4616xwtbj2di	14948 RUM BOTRAN RISERVA BLANCA CL70 0,70 BOT 1 22,95		L	\N	2025-11-25 15:01:08.601	2025-11-25 15:01:08.601	\N
hq08kli4qdrk5m6lkrypei11	xxevpbrra70t4616xwtbj2di	14949 RUM BOTRAN SOLERA 18 Y CL 70  (1893) 0,70 BOT 1 51,38		L	\N	2025-11-25 15:01:09.236	2025-11-25 15:01:09.236	\N
hmcpak4uo4tel5ivtin62qet	xxevpbrra70t4616xwtbj2di	14460 RUM BRUGAL ANEJO SCURO LT 1 1,00 BOT 1 17,25		PIECE	\N	2025-11-25 15:01:09.895	2025-11-25 15:01:09.895	\N
gsb0ds1pnvutjr98ws5zik2d	xxevpbrra70t4616xwtbj2di	14630 RUM BRUGAL EXTRA DRY LT 1 1,00 BOT 1 15,08		PIECE	\N	2025-11-25 15:01:10.613	2025-11-25 15:01:10.613	\N
mfsujmrzqlkc5ys3mw28iovf	xxevpbrra70t4616xwtbj2di	14124 RUM BUMBU ORIG. CL 70 0,70 BOT 1 34,20		L	\N	2025-11-25 15:01:11.25	2025-11-25 15:01:11.25	\N
rfuhxu3uwoh0d0pdrjg5oys6	xxevpbrra70t4616xwtbj2di	14157 RUM BUMBU XO CL 70 0,70 BOT 1 40,50		L	\N	2025-11-25 15:01:11.897	2025-11-25 15:01:11.897	\N
ptew1c4nuqkbqxhekgwfwg03	xxevpbrra70t4616xwtbj2di	14017 RUM CACIQUE ANEJO CL.70 0,70 BOT 1 17,55		L	\N	2025-11-25 15:01:12.538	2025-11-25 15:01:12.538	\N
od5kqho2qi9tq6eko1c7uxa9	xxevpbrra70t4616xwtbj2di	14888 RUM CAPITAN MORGAN BLACK LT 1,00 BOT 1 20,25		PIECE	\N	2025-11-25 15:01:13.181	2025-11-25 15:01:13.181	\N
mxchjd46ro5namvye6si4mc4	xxevpbrra70t4616xwtbj2di	14254 RUM CAPITAN MORGAN SPICED CL70 0,70 BOT 1 11,63		L	\N	2025-11-25 15:01:13.819	2025-11-25 15:01:13.819	\N
fz1yibmdzoimgjnuqg7anndb	xxevpbrra70t4616xwtbj2di	14335 RUM CAPITAN MORGAN SPICED LT1 1,00 BOT 1 16,95		PIECE	\N	2025-11-25 15:01:14.454	2025-11-25 15:01:14.454	\N
s4lhelfwfht8aqcn2ohk25dx	xxevpbrra70t4616xwtbj2di	14490 RUM CAPITAN MORGAN WHITE LT 1,00 BOT 1 19,13		PIECE	\N	2025-11-25 15:01:15.093	2025-11-25 15:01:15.093	\N
ox8kn8ju1toxz8se92j2x5g3	xxevpbrra70t4616xwtbj2di	15073 RUM CARACAS 8 Y  CL 70 0,70 BOT 1 29,25		L	\N	2025-11-25 15:01:15.729	2025-11-25 15:01:15.729	\N
ei09vxmn3eth728rseygoikq	xxevpbrra70t4616xwtbj2di	15072 RUM CARACAS HONEY CL 70 0,70 BOT 1 31,05		L	\N	2025-11-25 15:01:16.367	2025-11-25 15:01:16.367	\N
vn5915gwjkmegs7fmkkwpaas	xxevpbrra70t4616xwtbj2di	15128 RUM CARACAS NECTAR CL 70 0,70 BOT 1 29,25		L	\N	2025-11-25 15:01:17.01	2025-11-25 15:01:17.01	\N
v67nxs4j2381vuss53w21edw	xxevpbrra70t4616xwtbj2di	15040 RUM CARUPANO ESCL. 12 Y CL 70 0,70 BOT 1 30,23		L	\N	2025-11-25 15:01:17.647	2025-11-25 15:01:17.647	\N
pxw2nf936bhtagz8nuajxy1v	xxevpbrra70t4616xwtbj2di	15041 RUM CARUPANO LIMITADA 18 Y CL 70 0,70 BOT 1 43,65		L	\N	2025-11-25 15:01:18.287	2025-11-25 15:01:18.287	\N
u57b8xvccy939499fohbg04h	xxevpbrra70t4616xwtbj2di	15038 RUM CLEMENT CREOLE SHRUBB CL 70 0,70 BOT 1 27,00		L	\N	2025-11-25 15:01:18.922	2025-11-25 15:01:18.922	\N
f6kctxnuqwkajdwczav54ssf	xxevpbrra70t4616xwtbj2di	15039 RUM CLEMENT VIEUX XO CL 70 0,70 BOT 1 57,23		L	\N	2025-11-25 15:01:19.562	2025-11-25 15:01:19.562	\N
ut2gmwtvz4u4rdn979pqu3i8	xxevpbrra70t4616xwtbj2di	15036 RUM COLON COFFE CL. 70 0,70 BOT 1 31,43		L	\N	2025-11-25 15:01:20.206	2025-11-25 15:01:20.206	\N
t9j8ok3p825kk00w1jrkyfr8	xxevpbrra70t4616xwtbj2di	15057 RUM COLON RUMZCAL CL 70 0,70 BOT 1 41,33		L	\N	2025-11-25 15:01:20.842	2025-11-25 15:01:20.842	\N
capb7lti7wn5fn1gwsdzkfi4	xxevpbrra70t4616xwtbj2di	15037 RUM COLON RYE CL. 70 0,70 BOT 1 37,13		L	\N	2025-11-25 15:01:21.48	2025-11-25 15:01:21.48	\N
w33enzldgejcpditx9lm4s3p	xxevpbrra70t4616xwtbj2di	14610 RUM DARK ISLA ANTIQUA LT 1 1,00 BOT 1 10,95		PIECE	\N	2025-11-25 15:01:22.177	2025-11-25 15:01:22.177	\N
ke2rvgvf7fremnlhqjxrj49e	xxevpbrra70t4616xwtbj2di	14013 RUM DIPLOMAT. RIS. ESCL. 12 Y CL 70 0,70 BOT 1 33,00		L	\N	2025-11-25 15:01:22.818	2025-11-25 15:01:22.818	\N
wc0wqtkt54cxxhzvgw3zney5	xxevpbrra70t4616xwtbj2di	14837 RUM DIPLOMATICO MANTUANO CL 70 0,70 BOT 1 25,95		L	\N	2025-11-25 15:01:23.462	2025-11-25 15:01:23.462	\N
eztpsgtdnarhy0uaah0hf9j8	xxevpbrra70t4616xwtbj2di	14838 RUM DIPLOMATICO PLANAS CL 70 0,70 BOT 1 30,45		L	\N	2025-11-25 15:01:24.17	2025-11-25 15:01:24.17	\N
gqs8rwq0wggmpp21dxy5zh6m	xxevpbrra70t4616xwtbj2di	14307 RUM DOBLE 9 ANEJO 15 Y  CL 70 0,70 BOT 1 48,75		L	\N	2025-11-25 15:01:24.81	2025-11-25 15:01:24.81	\N
p9w8e9i8t3xluix2mddb234i	xxevpbrra70t4616xwtbj2di	14317 RUM DOBLE 9 ANEJO 5 Y  CL 70 0,70 BOT 1 14,78		L	\N	2025-11-25 15:01:25.496	2025-11-25 15:01:25.496	\N
mh2eyufgykv3aijioo8wogqa	xxevpbrra70t4616xwtbj2di	14312 RUM DOBLE 9 BLANCO 3 Y  CL 70 0,70 BOT 1 12,90		L	\N	2025-11-25 15:01:26.131	2025-11-25 15:01:26.131	\N
yruuducnx1a8q8nj7xcifkym	xxevpbrra70t4616xwtbj2di	14363 RUM DOBLE 9 ELIXIR  CL 70 0,70 BOT 1 15,30		L	\N	2025-11-25 15:01:26.767	2025-11-25 15:01:26.767	\N
s9yxjyib0x6jy824gtbmbz8k	xxevpbrra70t4616xwtbj2di	14613 RUM DON PAPA  BAROKO CL 70 0,70 BOT 1 34,95		L	\N	2025-11-25 15:01:27.407	2025-11-25 15:01:27.407	\N
idz08h0048iu8msm1lk9sep8	xxevpbrra70t4616xwtbj2di	14194 RUM DOORLY'S 3 Y CL 70 0,70 BOT 1 20,70		L	\N	2025-11-25 15:01:28.047	2025-11-25 15:01:28.047	\N
ws5dwtsf2hu3l3j9q0be1u6p	xxevpbrra70t4616xwtbj2di	14195 RUM DOORLY'S 5 Y CL 70 0,70 BOT 1 23,55		L	\N	2025-11-25 15:01:28.684	2025-11-25 15:01:28.684	\N
ggjrztij38ohum46smdzolk0	xxevpbrra70t4616xwtbj2di	14366 RUM EL DORADO  12 Y CL 70 0,70 BOT 1 37,13		L	\N	2025-11-25 15:01:29.321	2025-11-25 15:01:29.321	\N
ti2sa6aw8eczr7bz6pmp8a47	xxevpbrra70t4616xwtbj2di	14762 RUM FLOR DE CANA 12Y CL 70 0,70 BOT 1 33,75		L	\N	2025-11-25 15:01:29.956	2025-11-25 15:01:29.956	\N
lzavps34sm21zcq9qtckakfp	xxevpbrra70t4616xwtbj2di	15051 RUM GOSLING SEAL BLACK LT 1,00 BOT 1 30,98		PIECE	\N	2025-11-25 15:01:30.59	2025-11-25 15:01:30.59	\N
cb0nzw2884pm1qvtu2k2hifg	xxevpbrra70t4616xwtbj2di	14349 RUM HAVANA CLUB 3 Y ORIG.LT 1 1,00 BOT 1 17,33		PIECE	\N	2025-11-25 15:01:31.292	2025-11-25 15:01:31.292	\N
yolit8x7mm95d8jt7r8167rs	xxevpbrra70t4616xwtbj2di	14243 RUM HAVANA CLUB 7 Y ORIG CL 70 0,70 BOT 1 24,00		L	\N	2025-11-25 15:01:31.926	2025-11-25 15:01:31.926	\N
bz76v3rwgqqjc82ocwx6cxpb	xxevpbrra70t4616xwtbj2di	14302 RUM HAVANA CLUB ESPECIAL CL 100 1,00 BOT 1 19,95		PIECE	\N	2025-11-25 15:01:32.564	2025-11-25 15:01:32.564	\N
g2if3hsr7yqysqbjhautvso1	xxevpbrra70t4616xwtbj2di	14165 RUM HURRICANE DARK LT 1 1,00 BOT 1 14,78		PIECE	\N	2025-11-25 15:01:33.202	2025-11-25 15:01:33.202	\N
qnu24qdsapq4cxfb657pyuav	xxevpbrra70t4616xwtbj2di	14008 RUM J. BALLY A. PIRAMIDE 7Y CL.0.70 0,70 BOT 1 69,00		L	\N	2025-11-25 15:01:33.859	2025-11-25 15:01:33.859	\N
jgjdk2awhezski05tm0z56f8	xxevpbrra70t4616xwtbj2di	14461 RUM J.BALLY AMBRE' MARTINIQUE.  CL.70 0,70 BOT 1 25,50		L	\N	2025-11-25 15:01:34.487	2025-11-25 15:01:34.487	\N
h0fjkqfzfnvtgqtgejexem9z	xxevpbrra70t4616xwtbj2di	14974 RUM JAMAICA COVE BANANA  CL 70 0,70 BOT 1 21,83		L	\N	2025-11-25 15:01:35.132	2025-11-25 15:01:35.132	\N
fm3uvdu2ol0mjjqallwx6nxz	xxevpbrra70t4616xwtbj2di	14973 RUM JAMAICA COVE PINEAPPLE  CL 70 0,70 BOT 1 21,83		L	\N	2025-11-25 15:01:35.766	2025-11-25 15:01:35.766	\N
g8fkkgmrlzdgnmxwqunax8tl	xxevpbrra70t4616xwtbj2di	14644 RUM KINGSTOM 62 GOLD SPEC. LT1 1,00 BOT 1 14,48		PIECE	\N	2025-11-25 15:01:36.402	2025-11-25 15:01:36.402	\N
elg4k4ekraylnxuhtb5clmy0	xxevpbrra70t4616xwtbj2di	14033 RUM KINGSTOM 62 WHITE LT.1 1,00 BOT 1 12,60		PIECE	\N	2025-11-25 15:01:37.042	2025-11-25 15:01:37.042	\N
k95oepunqzm5wo5jpqe135ri	xxevpbrra70t4616xwtbj2di	14680 RUM KRAKEN CL 70 0,70 BOT 1 22,65		L	\N	2025-11-25 15:01:37.688	2025-11-25 15:01:37.688	\N
xf7ncivz4lm58grhbwvugf24	xxevpbrra70t4616xwtbj2di	14346 RUM MATUSALEM G.RISERVA 15 Y.O. CL 70 0,70 BOT 1 25,28		L	\N	2025-11-25 15:01:38.332	2025-11-25 15:01:38.332	\N
czoaod01amkksja3k5mo9unu	xxevpbrra70t4616xwtbj2di	14325 RUM MATUSALEM SOLERA 7 Y CL70*1 0,70 BOT 1 17,70		L	\N	2025-11-25 15:01:39.034	2025-11-25 15:01:39.034	\N
ndplcenot7vv3h6s40k0b5vc	xxevpbrra70t4616xwtbj2di	15116 RUM MULATA 15 Y  CL 70 0,70 BOT 1 58,73		L	\N	2025-11-25 15:01:39.677	2025-11-25 15:01:39.677	\N
dq1gwt3wy1k7na4gfuua8agr	xxevpbrra70t4616xwtbj2di	15074 RUM MULATA SILVER  CL 70 0,70 BOT 1 12,75		L	\N	2025-11-25 15:01:40.313	2025-11-25 15:01:40.313	\N
xsd70l8b5idjcqd7idpbs8jl	xxevpbrra70t4616xwtbj2di	14479 RUM MYERS'S 70* 0,70 BOT 1 15,00		L	\N	2025-11-25 15:01:40.954	2025-11-25 15:01:40.954	\N
ch2cvo5bil8pxbbcpbo6dzau	xxevpbrra70t4616xwtbj2di	14237 RUM PAMPERO ANNIV. CL.70 0,70 BOT 1 24,45		L	\N	2025-11-25 15:01:41.594	2025-11-25 15:01:41.594	\N
t8gsbc6c21bga4mrc24rlylh	xxevpbrra70t4616xwtbj2di	14435 RUM PAMPERO BIANCO LITRO 1,00 BOT 1 12,23		PIECE	\N	2025-11-25 15:01:42.233	2025-11-25 15:01:42.233	\N
opufnrler2f5m3dqo9ck0j72	xxevpbrra70t4616xwtbj2di	14241 RUM PAMPERO ESPECIAL CL.100 1,00 BOT 1 16,13		PIECE	\N	2025-11-25 15:01:42.877	2025-11-25 15:01:42.877	\N
f5390azk28c10qkygx1g0gkt	xxevpbrra70t4616xwtbj2di	14988 RUM PAPPAGALLI JAMAICA CL 70 0,70 BOT 1 88,88		L	\N	2025-11-25 15:01:43.514	2025-11-25 15:01:43.514	\N
ye1bfe25xuopeuxs57c6ecgc	xxevpbrra70t4616xwtbj2di	14790 RUM PLANTATION 20Y ANNIV. XO  CL 70 0,70 BOT 1 56,63		L	\N	2025-11-25 15:01:44.154	2025-11-25 15:01:44.154	\N
mpmj6fey3wwhd80186were23	xxevpbrra70t4616xwtbj2di	14794 RUM PLANTATION 3 STAR CL70 0,70 BOT 1 17,40		L	\N	2025-11-25 15:01:44.794	2025-11-25 15:01:44.794	\N
i6yakqf6tkqocdpl02mji3y7	xxevpbrra70t4616xwtbj2di	14878 RUM PLANTATION GUYANA 2007 CL  70 0,70 BOT 1 71,25		L	\N	2025-11-25 15:01:45.428	2025-11-25 15:01:45.428	\N
pe6qkpvqp8ax0dtmgz9ikjcg	xxevpbrra70t4616xwtbj2di	14792 RUM PLANTATION OVER PROOF CL70 0,70 BOT 1 31,88		L	\N	2025-11-25 15:01:46.19	2025-11-25 15:01:46.19	\N
nrn65vxbdxd4nzgloe9boynx	xxevpbrra70t4616xwtbj2di	14793 RUM PLANTATION PINEAPPLE CL70 0,70 BOT 1 38,40		L	\N	2025-11-25 15:01:46.848	2025-11-25 15:01:46.848	\N
m5nmri2fvk141bg8ry4csa69	xxevpbrra70t4616xwtbj2di	14918 RUM PLANTATION XAYMACA CL 70 0,70 BOT 1 33,38		L	\N	2025-11-25 15:01:47.486	2025-11-25 15:01:47.486	\N
detqrf6ixxyxm0pxlw59hw3b	xxevpbrra70t4616xwtbj2di	15070 RUM RELICARIO PEATED FINISH CL 70 0,70 BOT 1 44,25		L	\N	2025-11-25 15:01:48.13	2025-11-25 15:01:48.13	\N
qs9t0f2c3i79plrglq5q1zrx	xxevpbrra70t4616xwtbj2di	15069 RUM RELICARIO SUPERIOR 10 Y CL 70 0,70 BOT 1 31,05		L	\N	2025-11-25 15:01:48.763	2025-11-25 15:01:48.763	\N
dkekt21yf53zjuk9f7ddwhdw	xxevpbrra70t4616xwtbj2di	15071 RUM RELICARIO VERMOUTH FINISH CL 70 0,70 BOT 1 44,25		L	\N	2025-11-25 15:01:49.408	2025-11-25 15:01:49.408	\N
dlmrsoksrfii21zugkya4sw6	xxevpbrra70t4616xwtbj2di	15000 RUM RUMP@BLIC GOLD LT 1 1,00 BOT 1 15,38		PIECE	\N	2025-11-25 15:01:50.053	2025-11-25 15:01:50.053	\N
r5jhecqpb2ygneepfv8fhj35	xxevpbrra70t4616xwtbj2di	14761 RUM RUMP@BLIC ORIGIN SPAGNA/VE NEZUELA CL 70 0,70 BOT 1 20,48		L	\N	2025-11-25 15:01:50.702	2025-11-25 15:01:50.702	\N
mw1p2wic5gvbm01y3nxjytnx	xxevpbrra70t4616xwtbj2di	14934 RUM RUMP@BLIC WHITE LT 1 1,00 BOT 1 12,00		PIECE	\N	2025-11-25 15:01:51.34	2025-11-25 15:01:51.34	\N
m7ewpal4rrc9lsbom4t69ctk	xxevpbrra70t4616xwtbj2di	14164 RUM S.TERESA SOL 1796 CL 70 0,70 BOT 1 39,38		L	\N	2025-11-25 15:01:51.989	2025-11-25 15:01:51.989	\N
xjtjy17zyzljlelfpj8pyojg	xxevpbrra70t4616xwtbj2di	14061 RUM SAILOR JERRY CL 70 0,70 BOT 1 18,00		L	\N	2025-11-25 15:01:52.627	2025-11-25 15:01:52.627	\N
tck223snxaz7bzre57u1yvhj	xxevpbrra70t4616xwtbj2di	14584 RUM SCURO DI CICCO 2 LT 2,00 BOT 1 16,35		PIECE	\N	2025-11-25 15:01:53.269	2025-11-25 15:01:53.269	\N
fawhr7cx45gc84ax4jcv7xph	xxevpbrra70t4616xwtbj2di	14956 RUM THE DEMON SHARE CL 70 0,70 BOT 1 34,35		L	\N	2025-11-25 15:01:53.906	2025-11-25 15:01:53.906	\N
kr93x4b5bculiy6qksxvkh3s	xxevpbrra70t4616xwtbj2di	14870 RUM TROIS RIVIERES BLANC CL 70 0,70 BOT 1 19,20		L	\N	2025-11-25 15:01:54.608	2025-11-25 15:01:54.608	\N
o6w35sr16yqnyd1egyimkbh4	xxevpbrra70t4616xwtbj2di	14609 RUM WHITE ISLA ANTIGUA LT 1 1,00 BOT 1 10,73		L	\N	2025-11-25 15:01:55.248	2025-11-25 15:01:55.248	\N
dcug1vfoewn2c0cj3tftgmk7	xxevpbrra70t4616xwtbj2di	14187 RUM WHITE NEPHEW OVERPROOF CL 70 0,70 BOT 1 37,13		L	\N	2025-11-25 15:01:55.882	2025-11-25 15:01:55.882	\N
c4cg9yyuywmacorkvgu0w008	xxevpbrra70t4616xwtbj2di	14372 RUM ZACAPA 23 A. CL 70 0,70 BOT 1 56,85		L	\N	2025-11-25 15:01:56.521	2025-11-25 15:01:56.521	\N
lowj85t4qc9qqdshnwne7aoi	xxevpbrra70t4616xwtbj2di	14431 RUM ZACAPA XO 25Y CL. 70 0,70 BOT 1 135,75		L	\N	2025-11-25 15:01:57.162	2025-11-25 15:01:57.162	\N
xj4xzzf8ntj91sg4z7k2nreu	xxevpbrra70t4616xwtbj2di	14957 FABBRI TOPPING CACAO 1 KG 0,75 BOT 1 12,98		L	\N	2025-11-25 15:01:57.811	2025-11-25 15:01:57.811	\N
pt6pj8bqy0x2z532pv4ejska	xxevpbrra70t4616xwtbj2di	14458 MONIN PUREA ANANAS LT 1 1,00 BOT 1 16,50		PIECE	\N	2025-11-25 15:01:58.447	2025-11-25 15:01:58.447	\N
fdo4hbmu5fmoe0tl3v4znov1	xxevpbrra70t4616xwtbj2di	14415 MONIN PUREA COCCO LT 1 1,00 BOT 1 19,50		PIECE	\N	2025-11-25 15:01:59.08	2025-11-25 15:01:59.08	\N
lswkm21refbkkjv6n9kz1vvw	xxevpbrra70t4616xwtbj2di	14451 MONIN PUREA FRAGOLA LT 1 1,00 BOT 1 16,50		PIECE	\N	2025-11-25 15:01:59.714	2025-11-25 15:01:59.714	\N
kwdn0x3ksqufbh9sec5rg97l	xxevpbrra70t4616xwtbj2di	14452 MONIN PUREA FRUTTI ROSSI LT 1 1,00 BOT 1 16,50		PIECE	\N	2025-11-25 15:02:00.352	2025-11-25 15:02:00.352	\N
fyh6hkfn4ehqwszjfifxds33	xxevpbrra70t4616xwtbj2di	14456 MONIN PUREA FRUTTO PASSIONE LT 1 1,00 BOT 1 16,50		PIECE	\N	2025-11-25 15:02:00.995	2025-11-25 15:02:00.995	\N
sfxhhsnqhdibhx1pyjhwq9xy	xxevpbrra70t4616xwtbj2di	14449 MONIN PUREA LAMPONE LT 1 1,00 BOT 1 19,50		PIECE	\N	2025-11-25 15:02:01.681	2025-11-25 15:02:01.681	\N
pl3nlburwfskd0ela1d8jtri	xxevpbrra70t4616xwtbj2di	14454 MONIN PUREA MANGO LT 1 1,00 BOT 1 19,50		PIECE	\N	2025-11-25 15:02:02.328	2025-11-25 15:02:02.328	\N
eak7hrsoxi52kl39tyv0pmp5	xxevpbrra70t4616xwtbj2di	14455 MONIN PUREA PESCA LT 1 1,00 BOT 1 16,50		PIECE	\N	2025-11-25 15:02:02.963	2025-11-25 15:02:02.963	\N
yqez3hir5wh8pk25px2tugrq	xxevpbrra70t4616xwtbj2di	14726 MONIN SCIR. AGAVE CL 70 0,70 BOT 1 12,15		L	\N	2025-11-25 15:02:03.602	2025-11-25 15:02:03.602	\N
ui2lovakvb3bjgvwjbw5dqcy	xxevpbrra70t4616xwtbj2di	14666 MONIN SCIR. ALLE ROSE CL 70 0,70 BOT 1 9,75		L	\N	2025-11-25 15:02:04.237	2025-11-25 15:02:04.237	\N
ktdvl7579o0yckkll20qvaxe	xxevpbrra70t4616xwtbj2di	15149 MONIN SCIR. ANGURIA CL 70 0,70 BOT 1 9,75		L	\N	2025-11-25 15:02:04.875	2025-11-25 15:02:04.875	\N
ygaw0xkeeis1xbcx075mhxdt	xxevpbrra70t4616xwtbj2di	15113 MONIN SCIR. CANNELLA CL 70 0,70 BOT 1 9,75		L	\N	2025-11-25 15:02:05.511	2025-11-25 15:02:05.511	\N
ap0yzxkx3muyu07ggrf974tx	xxevpbrra70t4616xwtbj2di	14755 MONIN SCIR. COCCO CL 70 0,70 BOT 1 9,75		L	\N	2025-11-25 15:02:06.149	2025-11-25 15:02:06.149	\N
zg4jaahmtks0jjj3hvpmsuyf	xxevpbrra70t4616xwtbj2di	14269 MONIN SCIR. FIORI SAMBUCO ELD.  CL 70 0,70 BOT 1 9,75		L	\N	2025-11-25 15:02:06.786	2025-11-25 15:02:06.786	\N
pmqg1iev0c6hjdn1z10c4xd3	xxevpbrra70t4616xwtbj2di	15135 MONIN SCIR. FRAGOLA CL 70 0,70 BOT 1 9,75		L	\N	2025-11-25 15:02:07.446	2025-11-25 15:02:07.446	\N
mgd9acvli7xeoshwtrl13phu	xxevpbrra70t4616xwtbj2di	15148 MONIN SCIR. GRANATINA CL 70 0,70 BOT 1 9,75		L	\N	2025-11-25 15:02:08.081	2025-11-25 15:02:08.081	\N
mbn1efzmyiydnpxyixl7iwab	xxevpbrra70t4616xwtbj2di	15094 MONIN SCIR. IBISCUS CL 70 0,70 BOT 1 9,75		L	\N	2025-11-25 15:02:08.718	2025-11-25 15:02:08.718	\N
el550t09kafcqp7a8yrzoudj	xxevpbrra70t4616xwtbj2di	14917 MONIN SCIR. MANGO CL 70 0,70 BOT 1 9,75		L	\N	2025-11-25 15:02:09.443	2025-11-25 15:02:09.443	\N
knadrj65qwrhizavfxv5436o	xxevpbrra70t4616xwtbj2di	15120 MONIN SCIR. MELONE CL 70 0,70 BOT 1 9,75		L	\N	2025-11-25 15:02:10.075	2025-11-25 15:02:10.075	\N
s1icwj02zdxgk39n1ons0kvn	xxevpbrra70t4616xwtbj2di	15005 MONIN SCIR. MIELE CL 70 0,70 BOT 1 9,75		L	\N	2025-11-25 15:02:10.748	2025-11-25 15:02:10.748	\N
aui0m7aw9nesnup5fnubem5t	xxevpbrra70t4616xwtbj2di	15093 MONIN SCIR. MORE CL 70 0,70 BOT 1 9,75		L	\N	2025-11-25 15:02:11.381	2025-11-25 15:02:11.381	\N
dpjh8gfa4enpyo2hx9rjsg9s	xxevpbrra70t4616xwtbj2di	14748 MONIN SCIR. ORZATA CL 70 0,70 BOT 1 9,75		L	\N	2025-11-25 15:02:12.017	2025-11-25 15:02:12.017	\N
rl6x7q0vgz8b5sx7x3agxhvg	xxevpbrra70t4616xwtbj2di	15110 MONIN SCIR. PASSION FRUIT CL 70 0,70 BOT 1 9,75		L	\N	2025-11-25 15:02:12.658	2025-11-25 15:02:12.658	\N
d95o6ae1f49w0gv0dfge8wrw	xxevpbrra70t4616xwtbj2di	15115 MONIN SCIR. PESCA CL 70 0,70 BOT 1 9,75		L	\N	2025-11-25 15:02:13.4	2025-11-25 15:02:13.4	\N
jcykpwyxrasqz1jwpclq26ki	xxevpbrra70t4616xwtbj2di	14826 MONIN SCIR. POMPELMO ROSA  CL 70 0,70 BOT 1 9,75		L	\N	2025-11-25 15:02:14.042	2025-11-25 15:02:14.042	\N
i3ny98uerq3ioba8adgieear	xxevpbrra70t4616xwtbj2di	15004 MONIN SCIR. SPACY MANGO/PEP  ERONCINO 70 0,70 BOT 1 9,75		L	\N	2025-11-25 15:02:14.675	2025-11-25 15:02:14.675	\N
s4k5fdr56jsoas1ru1z0ggpz	xxevpbrra70t4616xwtbj2di	14941 MONIN SCIR. VANIGLIA CL 70 0,70 BOT 1 9,75		L	\N	2025-11-25 15:02:15.313	2025-11-25 15:02:15.313	\N
bkj74pzr6hldpcjwn7d6ivkx	xxevpbrra70t4616xwtbj2di	1 lt DLL004		L	\N	2025-11-25 15:11:18.008	2025-11-25 15:11:18.008	\N
xz5254cng9m1f7eiuuwb2j21	xxevpbrra70t4616xwtbj2di	14295 NATY'S  LIME LT 1 1,00 BOT 1 5,33		PIECE	\N	2025-11-25 15:02:15.946	2025-11-25 15:02:15.946	\N
xxs87zxm195t7zv2hmea67lz	xxevpbrra70t4616xwtbj2di	14395 ODK ANANAS KG.1 0,75 BOT 1 10,43		L	\N	2025-11-25 15:02:16.631	2025-11-25 15:02:16.631	\N
rwv5axknuv1m4uo6ixonpna2	xxevpbrra70t4616xwtbj2di	14401 ODK BANANA KG.1 0,75 BOT 1 10,43		L	\N	2025-11-25 15:02:17.269	2025-11-25 15:02:17.269	\N
x5xy97latkmggh264xfl44hz	xxevpbrra70t4616xwtbj2di	14396 ODK COCCO KG.1 0,75 BOT 1 10,43		L	\N	2025-11-25 15:02:17.978	2025-11-25 15:02:17.978	\N
kx90o5dgyv3izpgt59ngzble	xxevpbrra70t4616xwtbj2di	14394 ODK FRAGOLA KG.1 0,75 BOT 1 10,43		L	\N	2025-11-25 15:02:18.611	2025-11-25 15:02:18.611	\N
porc99hbwzldukeos7wcewt6	xxevpbrra70t4616xwtbj2di	14404 ODK FRUTTI DI BOSCO KG.1 0,75 BOT 1 10,43		L	\N	2025-11-25 15:02:19.252	2025-11-25 15:02:19.252	\N
c2vkhssa733okm0mduva16l2	xxevpbrra70t4616xwtbj2di	14541 ODK GRANATINA (MELOGRANO) KG.1 0,75 BOT 1 10,43		L	\N	2025-11-25 15:02:19.89	2025-11-25 15:02:19.89	\N
npuhqgfcyyscj3gdsg6puu1u	xxevpbrra70t4616xwtbj2di	14399 ODK JUICE LIME POUCH BUSTA  ML  600 0,60 PEZ 1 6,90		L	\N	2025-11-25 15:02:20.529	2025-11-25 15:02:20.529	\N
ie5gum9be1tu2k7tpx9egyes	xxevpbrra70t4616xwtbj2di	14398 ODK KIWI KG.1 0,75 BOT 1 10,43		L	\N	2025-11-25 15:02:21.166	2025-11-25 15:02:21.166	\N
hjpztkuij2n047nbvugibn8j	xxevpbrra70t4616xwtbj2di	14520 ODK LAMPONE (RASPBERRY) KG.1 0,75 BOT 1 10,43		L	\N	2025-11-25 15:02:21.806	2025-11-25 15:02:21.806	\N
hli4w154m85kr1rasbog69ar	xxevpbrra70t4616xwtbj2di	14201 ODK MANGO 1 KG 0,75 BOT 1 10,43		L	\N	2025-11-25 15:02:22.449	2025-11-25 15:02:22.449	\N
y4jmew85fai5qcwfdmd8v78j	xxevpbrra70t4616xwtbj2di	14430 ODK MARACUJA-PASSION FRUIT KG.1 0,75 BOT 1 10,43		L	\N	2025-11-25 15:02:23.084	2025-11-25 15:02:23.084	\N
bj8k0aqb9oany4kyrm59jto9	xxevpbrra70t4616xwtbj2di	14400 ODK MELONE KG.1 0,75 BOT 1 10,43		L	\N	2025-11-25 15:02:23.724	2025-11-25 15:02:23.724	\N
nr88lt7nrpslgfpu327d6bby	xxevpbrra70t4616xwtbj2di	14658 ODK MORA (BLACKBERRY) 1 KG 0,75 BOT 1 10,43		L	\N	2025-11-25 15:02:24.357	2025-11-25 15:02:24.357	\N
u9fzoxu4k7cf3ehpj4viqigl	xxevpbrra70t4616xwtbj2di	14402 ODK PESCA KG.1 0,75 BOT 1 10,43		L	\N	2025-11-25 15:02:25.062	2025-11-25 15:02:25.062	\N
z2xh6osad7knys1n8mpoaq61	xxevpbrra70t4616xwtbj2di	15003 ODK POMP. ROSA  KG.1 0,75 BOT 1 10,43		L	\N	2025-11-25 15:02:25.702	2025-11-25 15:02:25.702	\N
vwht9q0oeeysku5c1f9iw0da	xxevpbrra70t4616xwtbj2di	14801 ODK SCIR. ACERO CL 75 0,75 BOT 1 8,18		L	\N	2025-11-25 15:02:26.348	2025-11-25 15:02:26.348	\N
fqogt2l7w0cbgwhax889xhzs	xxevpbrra70t4616xwtbj2di	15012 ODK SCIR. ANGURIA CL 75 0,75 BOT 1 8,18		L	\N	2025-11-25 15:02:26.99	2025-11-25 15:02:26.99	\N
bk3cq3gfh469e3zolru3lees	xxevpbrra70t4616xwtbj2di	14904 ODK SCIR. BASILICO CL 75 0,75 BOT 1 8,18		L	\N	2025-11-25 15:02:27.642	2025-11-25 15:02:27.642	\N
qt9qtlha9edp7ifoc25j1ktt	xxevpbrra70t4616xwtbj2di	15002 ODK SCIR. BUBBLE GUM  CL 75 0,75 BOT 1 8,18		L	\N	2025-11-25 15:02:28.275	2025-11-25 15:02:28.275	\N
vh8jfr5scgbgmw1z6vdfacv8	xxevpbrra70t4616xwtbj2di	14202 ODK SCIR. CETRIOLO CL 75 0,75 BOT 1 8,18		L	\N	2025-11-25 15:02:28.908	2025-11-25 15:02:28.908	\N
spfj2qmevt2g1wn2khof5vr2	xxevpbrra70t4616xwtbj2di	14081 ODK SCIR. ELDERFLOWER CL 75 0,75 BOT 1 8,18		L	\N	2025-11-25 15:02:29.551	2025-11-25 15:02:29.551	\N
f2genk75trxintz0vg25pvov	xxevpbrra70t4616xwtbj2di	14532 ODK SCIR. GINGER  CL 75 0,75 BOT 1 8,18		L	\N	2025-11-25 15:02:30.186	2025-11-25 15:02:30.186	\N
urq3mtgrhkugxsczfz0yt6xy	xxevpbrra70t4616xwtbj2di	14764 ODK SCIR. GRANATINA CL 75 0,75 BOT 1 8,18		L	\N	2025-11-25 15:02:30.824	2025-11-25 15:02:30.824	\N
z1mdwkucge90ekj6kg0wymbf	xxevpbrra70t4616xwtbj2di	15014 ODK SCIR. PANDAN CL 75 0,75 BOT 1 8,18		L	\N	2025-11-25 15:02:31.461	2025-11-25 15:02:31.461	\N
qmidptd3uwbis4jjo5kobtrk	xxevpbrra70t4616xwtbj2di	15001 ODK SCIR. PASSION FRUIT  CL 75 0,75 BOT 1 8,18		L	\N	2025-11-25 15:02:32.103	2025-11-25 15:02:32.103	\N
cjpe7c0fv9nvpcczvoy9jyzz	xxevpbrra70t4616xwtbj2di	14620 ODK SCIR.CARAMELLO CL 75 0,75 BOT 1 8,18		L	\N	2025-11-25 15:02:32.77	2025-11-25 15:02:32.77	\N
dxlbrn1iv9kcfrz9o31t4bat	xxevpbrra70t4616xwtbj2di	14905 ODK SCIR.PEPERONCINO CHILI CL  75 0,75 BOT 1 8,18		L	\N	2025-11-25 15:02:33.406	2025-11-25 15:02:33.406	\N
d66p6v4pdt6vzmwrtrf9fbrn	xxevpbrra70t4616xwtbj2di	14618 ODK SCIR.VANILLA  CL 75 0,75 BOT 1 8,18		L	\N	2025-11-25 15:02:34.041	2025-11-25 15:02:34.041	\N
aw0w6uows9m3f453sd3ge9ve	xxevpbrra70t4616xwtbj2di	14970 POLPOSITA MIXER PASSION FRUIT  GR.500 0,50 BOT 1 6,98		L	\N	2025-11-25 15:02:34.681	2025-11-25 15:02:34.681	\N
z8wny0oeklabtxikeielsqo9	xxevpbrra70t4616xwtbj2di	14766 SCIROPPO AGAVESITO CL 50 0,50 BOT 1 12,00		L	\N	2025-11-25 15:02:35.317	2025-11-25 15:02:35.317	\N
b3izgbmr3q6ijde5wjnaok8g	xxevpbrra70t4616xwtbj2di	14288 SCIROPPO MENTA PALLINI LT.1 1,00 BOT 1 9,90		PIECE	\N	2025-11-25 15:02:36.004	2025-11-25 15:02:36.004	\N
ccdk9gno8dl8ebg0d49y8w26	xxevpbrra70t4616xwtbj2di	14933 SCIROPPO MIXYBAR FABBRI COCCO  KG 1,3 1,00 BOT 1 15,53		KG	\N	2025-11-25 15:02:36.637	2025-11-25 15:02:36.637	\N
owildn3gqeqjcdft0xmez7zw	xxevpbrra70t4616xwtbj2di	14938 SCIROPPO MIXYBAR FABBRI FRAGOL  A KG 1,3 1,00 BOT 1 15,53		KG	\N	2025-11-25 15:02:37.276	2025-11-25 15:02:37.276	\N
ne07lx6gcrbncn9o07zhhr8o	xxevpbrra70t4616xwtbj2di	14812 SCIROPPO MIXYBAR FABBRI LATTE  MADORLA KG 1,3 1,00 BOT 1 15,53		KG	\N	2025-11-25 15:02:37.913	2025-11-25 15:02:37.913	\N
futr5f0995wqu87r4r4aynw7	xxevpbrra70t4616xwtbj2di	14942 SCIROPPO MIXYBAR FABBRI MANGO  KG 1,3 1,00 BOT 1 15,53		KG	\N	2025-11-25 15:02:38.549	2025-11-25 15:02:38.549	\N
xgyrn5945v1tjpk5ntp37rkj	xxevpbrra70t4616xwtbj2di	15060 SCIROPPO MIXYBAR FABBRI MARACU JA-PASSION KG.1.3 1,00 BOT 1 15,53		KG	\N	2025-11-25 15:02:39.187	2025-11-25 15:02:39.187	\N
k1m352m5nrdm0e9c96tt8c7b	xxevpbrra70t4616xwtbj2di	14234 SCIROPPO ORZATA PALLINI LT.1 1,00 BOT 1 9,90		PIECE	\N	2025-11-25 15:02:39.899	2025-11-25 15:02:39.899	\N
lm2h7a9ao6soqfpwwgb0k5qm	xxevpbrra70t4616xwtbj2di	14589 SWEET & SOUR MIXER LT 1,00 BOT 1 6,53		PIECE	\N	2025-11-25 15:02:40.542	2025-11-25 15:02:40.542	\N
d6x8bp8uvi19kjlolvt2mqrg	xxevpbrra70t4616xwtbj2di	14587 ZUCCHERO CANNA AMBR. MIXER LT 1,00 BOT 1 6,60		PIECE	\N	2025-11-25 15:02:41.178	2025-11-25 15:02:41.178	\N
fta78j6l0wghke79d8k9d1hd	xxevpbrra70t4616xwtbj2di	14588 ZUCCHERO LIQUIDO B.CO MIXER LT 1,00 BOT 1 6,60		PIECE	\N	2025-11-25 15:02:41.819	2025-11-25 15:02:41.819	\N
iugkfuecg8sevmcmxh5apekd	xxevpbrra70t4616xwtbj2di	14816 MEZCAL CASAMIGOS CL 70 0,70 BOT 1 64,20		L	\N	2025-11-25 15:02:42.455	2025-11-25 15:02:42.455	\N
j93n3dwv83dtaqwubmviv75n	xxevpbrra70t4616xwtbj2di	14740 MEZCAL ILEGAL JOVEN CL 50 0,50 BOT 1 37,05		L	\N	2025-11-25 15:02:43.098	2025-11-25 15:02:43.098	\N
yskzvt7frfx7q466qbb2q649	xxevpbrra70t4616xwtbj2di	14825 MEZCAL ILEGAL JOVEN CL  70 0,50 BOT 1 37,65		L	\N	2025-11-25 15:02:43.799	2025-11-25 15:02:43.799	\N
ys7ksg6gpjwsyryf5ilmq217	xxevpbrra70t4616xwtbj2di	14741 MEZCAL MONTE ALBAN CL 70 0,70 BOT 1 25,50		L	\N	2025-11-25 15:02:44.441	2025-11-25 15:02:44.441	\N
jw990aq4s7kuhr0383nif1y3	xxevpbrra70t4616xwtbj2di	14842 MEZCAL MONTELOBOS ESP.  CL 70 0,70 BOT 1 37,20		L	\N	2025-11-25 15:02:45.077	2025-11-25 15:02:45.077	\N
f6vufudkc5vfo6agqte3obbi	xxevpbrra70t4616xwtbj2di	14977 MEZCAL PELOTON DE LA MUERTE LT 1 1,00 BOT 1 36,90		PIECE	\N	2025-11-25 15:02:45.721	2025-11-25 15:02:45.721	\N
tusqj3aies160841n31gijej	xxevpbrra70t4616xwtbj2di	15081 MEZCAL PLANTA SANTA ANEJO CL 70 0,70 BOT 1 45,75		L	\N	2025-11-25 15:02:46.359	2025-11-25 15:02:46.359	\N
u7tanbyxoakfpxnm7wkqbikx	xxevpbrra70t4616xwtbj2di	15079 MEZCAL PLANTA SANTA JOVEN CL 70 0,70 BOT 1 34,95		L	\N	2025-11-25 15:02:46.998	2025-11-25 15:02:46.998	\N
p7vzlkvh61f00rfqoy293qag	xxevpbrra70t4616xwtbj2di	15080 MEZCAL PLANTA SANTA REPOSADO CL 70 0,70 BOT 1 38,63		L	\N	2025-11-25 15:02:47.68	2025-11-25 15:02:47.68	\N
qnq076hmduw8l0rnf5aej8i7	xxevpbrra70t4616xwtbj2di	1 lt DLL003		L	\N	2025-11-25 15:11:18.648	2025-11-25 15:11:18.648	\N
lvs6mxtbd61lkx0l13lat6mc	xxevpbrra70t4616xwtbj2di	14423 MEZCAL TEHUANA BENEVA CL 70 0,70 BOT 1 23,63		L	\N	2025-11-25 15:02:48.33	2025-11-25 15:02:48.33	\N
el1j1pelbprrdw70fx4ibr25	xxevpbrra70t4616xwtbj2di	14678 MEZCAL VIDA DEL MAGUEY CL 70 0,70 BOT 1 40,28		L	\N	2025-11-25 15:02:48.973	2025-11-25 15:02:48.973	\N
f44uyfqat8zktra8dq1pjmcn	xxevpbrra70t4616xwtbj2di	15049 MEZCAL XAMAN ESPADIN 42° CL 70 0,70 BOT 1 30,00		L	\N	2025-11-25 15:02:49.609	2025-11-25 15:02:49.609	\N
s95o20o7tql5dqib6ex1ctna	xxevpbrra70t4616xwtbj2di	14815 TEQUILA CASAMIGOS BLANCO CL.70 0,70 BOT 1 45,15		L	\N	2025-11-25 15:02:50.252	2025-11-25 15:02:50.252	\N
yat1zno5dhswil52h73tt285	xxevpbrra70t4616xwtbj2di	15015 TEQUILA CAZADORES BLANCO CL 70 0,70 BOT 1 16,65		L	\N	2025-11-25 15:02:50.886	2025-11-25 15:02:50.886	\N
l4nk517gy33umt3uwko1zlvc	xxevpbrra70t4616xwtbj2di	14924 TEQUILA CAZADORES REPOSADO LT 1,00 BOT 1 26,85		PIECE	\N	2025-11-25 15:02:52.256	2025-11-25 15:02:52.256	\N
htz8f01h7if48fvh1v2y9qxh	xxevpbrra70t4616xwtbj2di	14129 TEQUILA DON JULIO BLANCO CL.70 0,70 BOT 1 47,85		L	\N	2025-11-25 15:02:53.25	2025-11-25 15:02:53.25	\N
j71spk0j3mj3pccb75zzhyo9	xxevpbrra70t4616xwtbj2di	14130 TEQUILA DON JULIO REPOSADO CL 70 0,70 BOT 1 59,25		L	\N	2025-11-25 15:02:53.885	2025-11-25 15:02:53.885	\N
ffyeroxumnbrqpffdv9ucmqm	xxevpbrra70t4616xwtbj2di	15023 TEQUILA DON RAMON SILVER CL 70 0,70 BOT 1 21,38		L	\N	2025-11-25 15:02:54.617	2025-11-25 15:02:54.617	\N
wrr4y8ss354jfvjryi9si4zp	xxevpbrra70t4616xwtbj2di	14605 TEQUILA EL SANTERO LT 1 1,00 BOT 1 11,10		PIECE	\N	2025-11-25 15:02:55.247	2025-11-25 15:02:55.247	\N
rk4vphykba5t1w5q58ckxxqk	xxevpbrra70t4616xwtbj2di	14483 TEQUILA ESPOLON BLANCO*70 0,70 BOT 1 19,95		L	\N	2025-11-25 15:02:55.877	2025-11-25 15:02:55.877	\N
xxtuyde9u8awzbjhix39eiwf	xxevpbrra70t4616xwtbj2di	14482 TEQUILA ESPOLON REPOSADO *70 0,70 BOT 1 21,90		L	\N	2025-11-25 15:02:56.587	2025-11-25 15:02:56.587	\N
cwtxuiz4d6u3ko0ka036rkgj	xxevpbrra70t4616xwtbj2di	14004 TEQUILA HERRADURA SILVER CL 70 0,70 BOT 1 30,75		L	\N	2025-11-25 15:02:57.214	2025-11-25 15:02:57.214	\N
cm3bvj6dl3nenzoxpopkui03	xxevpbrra70t4616xwtbj2di	14362 TEQUILA JOSE CUERVO ESP.BIANCA LITRO 1,00 BOT 1 18,15		PIECE	\N	2025-11-25 15:02:57.841	2025-11-25 15:02:57.841	\N
y0q8ddkerjprdk00x624vis3	xxevpbrra70t4616xwtbj2di	14336 TEQUILA JOSE' CUERVO REPOSADO   LT 1 1,00 BOT 1 19,88		PIECE	\N	2025-11-25 15:02:58.473	2025-11-25 15:02:58.473	\N
hvzbuv0ev689x5plk0fcc4ij	xxevpbrra70t4616xwtbj2di	14003 TEQUILA OCHO BLANCO CL.50 0,50 BOT 1 31,28		L	\N	2025-11-25 15:02:59.102	2025-11-25 15:02:59.102	\N
s8xz27425q0eiwyx5e0qa3h1	xxevpbrra70t4616xwtbj2di	14727 TEQUILA OLMECA ALTOS PL. CL.70 0,70 BOT 1 21,23		L	\N	2025-11-25 15:02:59.738	2025-11-25 15:02:59.738	\N
vcw7f486tt411a881vioe5xr	xxevpbrra70t4616xwtbj2di	14785 TEQUILA PATRON ANEJO CL70 0,70 BOT 1 54,53		L	\N	2025-11-25 15:03:00.369	2025-11-25 15:03:00.369	\N
fius7zlcq7f5geaja025k2c7	xxevpbrra70t4616xwtbj2di	14591 TEQUILA PATRON REPOSADO CL.70 0,70 BOT 1 48,75		L	\N	2025-11-25 15:03:01.003	2025-11-25 15:03:01.003	\N
lc6tthcm1kaciw1m9om331pa	xxevpbrra70t4616xwtbj2di	14590 TEQUILA PATRON SILVER CL.70 0,70 BOT 1 45,75		L	\N	2025-11-25 15:03:01.639	2025-11-25 15:03:01.639	\N
cix4wduofi7cq2k4d04oxw5e	xxevpbrra70t4616xwtbj2di	15078 TEQUILA TRES SOMBREROS REPOSAD O  CL 70 0,70 BOT 1 44,25		L	\N	2025-11-25 15:03:02.269	2025-11-25 15:03:02.269	\N
u37uxolz4z6e2e3ri2ea306z	xxevpbrra70t4616xwtbj2di	15077 TEQUILA TRES SOMBREROS SILVER CL 70 0,70 BOT 1 13,95		L	\N	2025-11-25 15:03:02.905	2025-11-25 15:03:02.905	\N
y1chrcb76bcax655gymm9nwz	xxevpbrra70t4616xwtbj2di	14267 CHINA MARTINI CL 70 0,70 BOT 1 12,68		L	\N	2025-11-25 15:03:03.531	2025-11-25 15:03:03.531	\N
p06xbnbgt2e5qsuhmcteanmk	xxevpbrra70t4616xwtbj2di	14804 CINZANO VERM.1757 torino ROSSO  LT 1 1,00 BOT 1 27,68		PIECE	\N	2025-11-25 15:03:04.16	2025-11-25 15:03:04.16	\N
zkl3nl13nlu9ohl70cye5kvh	xxevpbrra70t4616xwtbj2di	15034 CINZANO VERMOUTH BIANCO LT 1 1,00 BOT 1 8,78		PIECE	\N	2025-11-25 15:03:04.791	2025-11-25 15:03:04.791	\N
ecxijpoonmrcplvsbq6q8jiv	xxevpbrra70t4616xwtbj2di	14060 CINZANO VERMOUTH ROSSO LT 1 1,00 BOT 1 8,78		PIECE	\N	2025-11-25 15:03:05.427	2025-11-25 15:03:05.427	\N
exxnukliszt26d8a79mpwp49	xxevpbrra70t4616xwtbj2di	14042 MARSALA FINE LILIBEO LT 1 1,00 BOT 1 5,93		PIECE	\N	2025-11-25 15:03:06.056	2025-11-25 15:03:06.056	\N
nlcbbn7fvm07fv8qaymamrfv	xxevpbrra70t4616xwtbj2di	14246 MARTINI ROSSO LITRO 1,00 BOT 1 7,95		PIECE	\N	2025-11-25 15:03:06.692	2025-11-25 15:03:06.692	\N
p04gmwqr74h9af1map4qyfu4	xxevpbrra70t4616xwtbj2di	14692 MARTINI RUBINO VERMOUTH CL 75 0,75 BOT 1 14,78		L	\N	2025-11-25 15:03:07.39	2025-11-25 15:03:07.39	\N
w878adciyoswiw4cjuiod6z0	xxevpbrra70t4616xwtbj2di	14547 PUNT E MES CARPANO LT.1 1,00 BOT 1 10,05		PIECE	\N	2025-11-25 15:03:08.023	2025-11-25 15:03:08.023	\N
tcwrnad3tzxsvrtdk3dy18le	xxevpbrra70t4616xwtbj2di	14820 VERMOUTH BELSAZAR DRY CL75 0,75 BOT 1 19,50		L	\N	2025-11-25 15:03:08.656	2025-11-25 15:03:08.656	\N
ryz50v3i5miqvuc1okdy3fws	xxevpbrra70t4616xwtbj2di	14768 VERMOUTH BELSAZAR RED CL75 0,75 BOT 1 25,13		L	\N	2025-11-25 15:03:09.289	2025-11-25 15:03:09.289	\N
idevo3gdpr6z6bda9k2g05pa	xxevpbrra70t4616xwtbj2di	14819 VERMOUTH BELSAZAR WHITE CL75 0,75 BOT 1 25,20		L	\N	2025-11-25 15:03:09.926	2025-11-25 15:03:09.926	\N
o1xb5zwrawwextf0fqtsa16h	xxevpbrra70t4616xwtbj2di	14065 VERMOUTH CARPANO ANTICA FORMULA LT1 1,00 BOT 1 27,15		PIECE	\N	2025-11-25 15:03:10.558	2025-11-25 15:03:10.558	\N
x8bo3cry197jratkzww7etbf	xxevpbrra70t4616xwtbj2di	14047 VERMOUTH CARPANO BIANCO 1,00 BOT 1 10,65		PIECE	\N	2025-11-25 15:03:11.19	2025-11-25 15:03:11.19	\N
o159gvpppsawgwdosvivot5j	xxevpbrra70t4616xwtbj2di	14471 VERMOUTH CARPANO ROSSO ANNIV. CLASS. LT 1 1,00 BOT 1 9,53		PIECE	\N	2025-11-25 15:03:11.821	2025-11-25 15:03:11.821	\N
ja9utgqyv061osasiq8pdu69	xxevpbrra70t4616xwtbj2di	14763 VERMOUTH CARPANO ROSSO MAGNUM LT 3 3,00 BOT 1 62,63		PIECE	\N	2025-11-25 15:03:12.452	2025-11-25 15:03:12.452	\N
r05k3aa62nkoovfu2l91lm4u	xxevpbrra70t4616xwtbj2di	14603 VERMOUTH CLAS.MARTELLETTI ROSS O CL 75 0,75 BOT 1 9,53		L	\N	2025-11-25 15:03:13.116	2025-11-25 15:03:13.116	\N
llhm329z4yg0nldt8b4z6rwb	xxevpbrra70t4616xwtbj2di	14884 VERMOUTH COCCHI DOPO TEATRO  CL 75 0,75 BOT 1 20,40		L	\N	2025-11-25 15:03:13.749	2025-11-25 15:03:13.749	\N
lijwrm0mfay1fy2hlcc7iod6	xxevpbrra70t4616xwtbj2di	14747 VERMOUTH COCCHI ROSE' CL.75 0,75 BOT 1 16,28		L	\N	2025-11-25 15:03:14.38	2025-11-25 15:03:14.38	\N
fbl94a5moeomnpvax31pu8s2	xxevpbrra70t4616xwtbj2di	14007 VERMOUTH COCCHI ROSSO CL.75 0,75 BOT 1 17,93		L	\N	2025-11-25 15:03:15.018	2025-11-25 15:03:15.018	\N
rnen8r1i0k9tcmflmtnakkkd	xxevpbrra70t4616xwtbj2di	14006 VERMOUTH DEL PROFESSORE BIANCO  CL.75 0,75 BOT 1 22,20		L	\N	2025-11-25 15:03:15.647	2025-11-25 15:03:15.647	\N
t5yv24rfe49igmywkvt028v7	xxevpbrra70t4616xwtbj2di	14132 VERMOUTH DEL PROFESSORE ROSSO CL.75 0,05 BOT 1 22,20		PIECE	\N	2025-11-25 15:03:16.283	2025-11-25 15:03:16.283	\N
e1423pterzx9ndsdwxa1l93k	xxevpbrra70t4616xwtbj2di	14932 VERMOUTH MARTINI BIANCO NUOVO LT 1,00 BOT 1 8,63		PIECE	\N	2025-11-25 15:03:16.911	2025-11-25 15:03:16.911	\N
builyz7gsj86cflviqy5z5to	xxevpbrra70t4616xwtbj2di	14953 VERMOUTH MARTINI EX DRY NUOVO LT 1,00 BOT 1 9,90		PIECE	\N	2025-11-25 15:03:17.538	2025-11-25 15:03:17.538	\N
xijoixkgwlb9n3i9f9y93e2w	xxevpbrra70t4616xwtbj2di	14891 VERMOUTH NOILLY PRAT CL 75 0,75 BOT 1 13,50		L	\N	2025-11-25 15:03:18.173	2025-11-25 15:03:18.173	\N
ei7gg8c7yrnmdqv8lhcp8gd8	xxevpbrra70t4616xwtbj2di	15067 VERMOUTH ROSSO BORBONE CL 75 0,75 BOT 1 12,90		L	\N	2025-11-25 15:03:18.8	2025-11-25 15:03:18.8	\N
n744ajknrcorlxgepnf6nboq	xxevpbrra70t4616xwtbj2di	14965 VERMOUTH ROSSO GAMONDI LT 1,00 BOT 1 7,05		PIECE	\N	2025-11-25 15:03:19.431	2025-11-25 15:03:19.431	\N
osmapves747azvvshrlg1fq8	xxevpbrra70t4616xwtbj2di	14537 VERMOUTH ROSSO LILLET CL.75 0,75 BOT 1 15,00		L	\N	2025-11-25 15:03:20.068	2025-11-25 15:03:20.068	\N
ml22z9wykpt3yo1rl0uk5q13	xxevpbrra70t4616xwtbj2di	15008 WHISKY ABERFELDY 12 Y CL 70 0,70 BOT 1 36,75		L	\N	2025-11-25 15:03:21	2025-11-25 15:03:21	\N
qtogzugrdgonwsi0ciijh79r	xxevpbrra70t4616xwtbj2di	14052 WHISKY ABERLOUR 16Y CL70 0,70 BOT 1 84,00		L	\N	2025-11-25 15:03:21.767	2025-11-25 15:03:21.767	\N
ignr0jqs0h07mdcn42hgm4ev	xxevpbrra70t4616xwtbj2di	14744 WHISKY AKASHI BLENDED CL 50 0,50 BOT 1 33,53		L	\N	2025-11-25 15:03:22.617	2025-11-25 15:03:22.617	\N
c9cejc0on48qysnaa36yo6ne	xxevpbrra70t4616xwtbj2di	14026 WHISKY ARDBEG 10Y CL 70 AST 0,70 BOT 1 52,73		L	\N	2025-11-25 15:03:23.256	2025-11-25 15:03:23.256	\N
jo37g01j527vdvcr2nheivq0	xxevpbrra70t4616xwtbj2di	14228 WHISKY BALLANTINE'S  LT 1,00 BOT 1 18,45		PIECE	\N	2025-11-25 15:03:24.358	2025-11-25 15:03:24.358	\N
xorlpgth7c6b6l7iisy7hkxs	xxevpbrra70t4616xwtbj2di	14745 WHISKY BOWMORE 12 Y CL 70 0,70 BOT 1 40,73		L	\N	2025-11-25 15:03:25.256	2025-11-25 15:03:25.256	\N
fw8yq6lws9rlq61n5m373qsv	xxevpbrra70t4616xwtbj2di	14015 WHISKY BUFFALO TRACE BOURB.KENT. CL 70 0,70 BOT 1 21,75		L	\N	2025-11-25 15:03:26.176	2025-11-25 15:03:26.176	\N
hpwxgwfuq3rkydpkdb5jcqzt	xxevpbrra70t4616xwtbj2di	14817 WHISKY BULLEIT 10 Y CL 70 0,70 BOT 1 39,00		L	\N	2025-11-25 15:03:27.111	2025-11-25 15:03:27.111	\N
akidrlwb7elno5kye54tkgb6	xxevpbrra70t4616xwtbj2di	14577 WHISKY BULLEIT BOURBON CL 70 0,70 BOT 1 18,75		L	\N	2025-11-25 15:03:29.084	2025-11-25 15:03:29.084	\N
qnw56zl57fbz0y3x0x4irv76	xxevpbrra70t4616xwtbj2di	14720 WHISKY BULLEIT RYE CL 70 0,70 BOT 1 30,00		L	\N	2025-11-25 15:03:30.122	2025-11-25 15:03:30.122	\N
az1g8y2t4nb3yonxjpprq5qe	xxevpbrra70t4616xwtbj2di	14142 WHISKY BUSHMILLS 10 Y SINGLE M . CL 70 0,70 BOT 1 33,00		L	\N	2025-11-25 15:03:30.955	2025-11-25 15:03:30.955	\N
sfqvs67kc8n2ec7vo673v6i0	xxevpbrra70t4616xwtbj2di	14310 WHISKY BUSHMILLS IRISH WHISKY CL 70 0,70 BOT 1 15,90		L	\N	2025-11-25 15:03:31.946	2025-11-25 15:03:31.946	\N
bfvifw4ihwxinp8n5dt0jzdi	xxevpbrra70t4616xwtbj2di	14358 WHISKY CANADIAN CLUB CL70 0,70 BOT 1 14,25		L	\N	2025-11-25 15:03:33.057	2025-11-25 15:03:33.057	\N
s0mkthiq6fr6kk48jcjmys5h	xxevpbrra70t4616xwtbj2di	14365 WHISKY CAOL ILA 12Y CL 70 0,70 BOT 1 50,78		L	\N	2025-11-25 15:03:33.97	2025-11-25 15:03:33.97	\N
g0pq8ktm0ygc2vfxirwu748n	xxevpbrra70t4616xwtbj2di	14632 WHISKY CHIVAS 12Y LT 1 1,00 BOT 1 33,75		PIECE	\N	2025-11-25 15:03:35.285	2025-11-25 15:03:35.285	\N
cd2d0bitivrpr9r8otjla6eh	xxevpbrra70t4616xwtbj2di	14220 WHISKY CRAGGAMORE 12 Y CL 70 0,70 BOT 1 53,63		L	\N	2025-11-25 15:03:36.109	2025-11-25 15:03:36.109	\N
ubsdpq457gqgg51vklsmt6a7	xxevpbrra70t4616xwtbj2di	14029 WHISKY CROWN ROYAL LT 1,00 BOT 1 36,00		PIECE	\N	2025-11-25 15:03:36.951	2025-11-25 15:03:36.951	\N
kjhxtf4kbqjm5eqhl5umczjc	xxevpbrra70t4616xwtbj2di	14872 WHISKY CUTTY SARK BL. CL 70 0,70 BOT 1 11,40		L	\N	2025-11-25 15:03:38.832	2025-11-25 15:03:38.832	\N
v81pcnloegwjn4hbkw3o6bxz	xxevpbrra70t4616xwtbj2di	14477 WHISKY DALWHINNIE 15 Y 70 0,70 BOT 1 52,50		L	\N	2025-11-25 15:03:40.398	2025-11-25 15:03:40.398	\N
x9kkgzq727s5pbq64rrokvh5	xxevpbrra70t4616xwtbj2di	14743 WHISKY DEWAR'S WHITE LABEL CL 70 0,70 BOT 1 13,50		L	\N	2025-11-25 15:03:41.251	2025-11-25 15:03:41.251	\N
sj5a6om92mfu7ikuowilfoy8	xxevpbrra70t4616xwtbj2di	14233 WHISKY DRAMBUIE 70 CL 0,70 BOT 1 23,25		L	\N	2025-11-25 15:03:42.123	2025-11-25 15:03:42.123	\N
hvkmkxb8ygql1007hrynjo7e	xxevpbrra70t4616xwtbj2di	15043 WHISKY FINLAGGAN OLD RESERVE CL 70 0,70 BOT 1 30,30		L	\N	2025-11-25 15:03:43.779	2025-11-25 15:03:43.779	\N
el0f2krhiyq1qdqwa3x6vy0c	xxevpbrra70t4616xwtbj2di	15044 WHISKY FINLAGGAN RED WINE CASK CL 70 0,70 BOT 1 44,40		L	\N	2025-11-25 15:03:45.918	2025-11-25 15:03:45.918	\N
iup4zek3w3djgsvybpzrvvgi	xxevpbrra70t4616xwtbj2di	14952 WHISKY FIREBALL CINNAMON CL 70 0,70 BOT 1 16,28		L	\N	2025-11-25 15:03:46.562	2025-11-25 15:03:46.562	\N
n9338vlwu4nllyxmthm8z8ur	xxevpbrra70t4616xwtbj2di	14345 WHISKY FOUR ROSES LT 1 1,00 BOT 1 20,70		L	\N	2025-11-25 15:03:47.193	2025-11-25 15:03:47.193	\N
qqcsa4mzcyxpiuew2t9rwr4g	xxevpbrra70t4616xwtbj2di	14562 WHISKY GLEN GRANT CL 70 0,70 BOT 1 16,65		L	\N	2025-11-25 15:03:47.823	2025-11-25 15:03:47.823	\N
o9w0yd1wyjf5k8vtktlb8gzk	xxevpbrra70t4616xwtbj2di	14323 WHISKY GLENFIDDICH12 ANNI CL70 0,70 BOT 1 44,40		L	\N	2025-11-25 15:03:48.455	2025-11-25 15:03:48.455	\N
kas406kwdjyh0r4rimov8rw2	xxevpbrra70t4616xwtbj2di	14796 WHISKY GLENLIVET 12 Y CL 70 0,70 BOT 1 34,20		L	\N	2025-11-25 15:03:49.087	2025-11-25 15:03:49.087	\N
uo5vbvsur7mlpqptwdxy3amr	xxevpbrra70t4616xwtbj2di	14434 WHISKY GLENLIVET FOUNDERS RESE RVE CL 70 0,70 BOT 1 34,88		L	\N	2025-11-25 15:03:49.715	2025-11-25 15:03:49.715	\N
e5rjyyby4o0swb7zdhckadnf	xxevpbrra70t4616xwtbj2di	14446 WHISKY GLENMORANGIE 10Y *70 0,70 BOT 1 39,60		L	\N	2025-11-25 15:03:50.349	2025-11-25 15:03:50.349	\N
aisujm4w20zs2kutj5do9287	xxevpbrra70t4616xwtbj2di	14964 WHISKY IRISH MIST CL 70 0,70 BOT 1 19,65		L	\N	2025-11-25 15:03:50.983	2025-11-25 15:03:50.983	\N
hdvo83wzq1eqeyriksaqcip5	xxevpbrra70t4616xwtbj2di	14263 WHISKY J&B DIAGEO LT 1,00 BOT 1 18,60		PIECE	\N	2025-11-25 15:03:51.618	2025-11-25 15:03:51.618	\N
ao5dm5zfe6vl62ejnvy116fz	xxevpbrra70t4616xwtbj2di	14426 WHISKY J. WALKER BLACK 12 Y.CL 70 0,70 BOT 1 27,00		L	\N	2025-11-25 15:03:52.249	2025-11-25 15:03:52.249	\N
cgvaz3tka5pio9rza9kkow8l	xxevpbrra70t4616xwtbj2di	14287 WHISKY J. WALKER RED LT 1,00 BOT 1 19,50		PIECE	\N	2025-11-25 15:03:52.885	2025-11-25 15:03:52.885	\N
io569p7yur7mmn0vq59n2a78	xxevpbrra70t4616xwtbj2di	15131 WHISKY JACK DANIEL'S APPLE LT 1,00 BOT 1 24,00		PIECE	\N	2025-11-25 15:03:53.584	2025-11-25 15:03:53.584	\N
nf35j38dtux9o40rqdmp6mtz	xxevpbrra70t4616xwtbj2di	14886 WHISKY JACK DANIEL'S FIRE 35  LT 1 1,00 BOT 1 24,00		PIECE	\N	2025-11-25 15:03:54.213	2025-11-25 15:03:54.213	\N
d3hfr467acvonw4h617rze84	xxevpbrra70t4616xwtbj2di	14119 WHISKY JACK DANIEL'S HONEY 35°  LT 1,00 BOT 1 24,00		PIECE	\N	2025-11-25 15:03:54.843	2025-11-25 15:03:54.843	\N
camqzdt3za9oie8hs3ebynhs	xxevpbrra70t4616xwtbj2di	14253 WHISKY JACK DANIEL'S LT 1,00 BOT 1 24,00		PIECE	\N	2025-11-25 15:03:55.493	2025-11-25 15:03:55.493	\N
jnzrqtihp2g2q5q910ppvef6	xxevpbrra70t4616xwtbj2di	14649 WHISKY JAMESON 40 LT 1 1,00 BOT 1 24,75		PIECE	\N	2025-11-25 15:03:56.123	2025-11-25 15:03:56.123	\N
sl06uri1muspb89cju3h16aq	xxevpbrra70t4616xwtbj2di	14470 WHISKY JAMESON BLACK BARREL CL  70 0,70 BOT 1 26,10		L	\N	2025-11-25 15:03:56.758	2025-11-25 15:03:56.758	\N
ve44j9beoy53wrnpz4whargc	xxevpbrra70t4616xwtbj2di	14414 WHISKY JIM BEAM  BOURBON LT. 1 1,00 BOT 1 18,00		PIECE	\N	2025-11-25 15:03:57.389	2025-11-25 15:03:57.389	\N
cid1u7jicdf5hqrru63x6zwv	xxevpbrra70t4616xwtbj2di	14929 WHISKY JIM BEAM RYE CL 70 0,70 BOT 1 19,73		L	\N	2025-11-25 15:03:58.022	2025-11-25 15:03:58.022	\N
ecahrkmntbfgw0ylk4cl7h5d	xxevpbrra70t4616xwtbj2di	14168 WHISKY KNOB CREEK BOURB. CL 70 0,70 BOT 1 35,18		L	\N	2025-11-25 15:03:58.651	2025-11-25 15:03:58.651	\N
tx954kxkwy4po6o2nc2z5rp5	xxevpbrra70t4616xwtbj2di	14272 WHISKY LAGAVULIN 16Y DIAGEO CL. 70 0,70 BOT 1 83,10		L	\N	2025-11-25 15:03:59.284	2025-11-25 15:03:59.284	\N
e1bnddxi0gtzbib5pe4wwvxl	xxevpbrra70t4616xwtbj2di	14348 WHISKY LAPHROAIG 10 Y CL 70 0,70 BOT 1 41,63		L	\N	2025-11-25 15:03:59.913	2025-11-25 15:03:59.913	\N
wz6nkw1hi1n5h4edxcwhn2pd	xxevpbrra70t4616xwtbj2di	15104 WHISKY MAKER'S MARK CL 100 1,00 BOT 1 34,95		PIECE	\N	2025-11-25 15:04:00.542	2025-11-25 15:04:00.542	\N
yrljuntd3b635nhn48022a90	xxevpbrra70t4616xwtbj2di	14378 WHISKY MAKER'S MARK CL.70 0,70 BOT 1 29,25		L	\N	2025-11-25 15:04:01.178	2025-11-25 15:04:01.178	\N
cb1phu7k6chw9t7mu1wsh3ui	xxevpbrra70t4616xwtbj2di	15092 WHISKY MARSHALL'S BOURB. CL 70 0,70 BOT 1 17,03		L	\N	2025-11-25 15:04:01.805	2025-11-25 15:04:01.805	\N
udramdm4oxcjedfngaybzmsf	xxevpbrra70t4616xwtbj2di	14637 WHISKY MONKEY SHOULDER CL70 0,70 BOT 1 31,50		L	\N	2025-11-25 15:04:02.439	2025-11-25 15:04:02.439	\N
bz2w7pwx2khzvg3ixugbcvz3	xxevpbrra70t4616xwtbj2di	14162 WHISKY NIKKA FROM THE BARREL CL 50 0,50 BOT 1 38,25		L	\N	2025-11-25 15:04:03.065	2025-11-25 15:04:03.065	\N
ma0gamn9iltarsi1fdrsjfg8	xxevpbrra70t4616xwtbj2di	14783 WHISKY NIKKA PURE MALT TAKETSU  RU CL 70 0,70 BOT 1 57,00		L	\N	2025-11-25 15:04:03.697	2025-11-25 15:04:03.697	\N
akh7exf28mvkaiq6q3djaibk	xxevpbrra70t4616xwtbj2di	14281 WHISKY OBAN 14Y DIAGEO CL. 70 0,70 BOT 1 67,73		L	\N	2025-11-25 15:04:04.343	2025-11-25 15:04:04.343	\N
mi61ksitp22nesm7o0eh00g7	xxevpbrra70t4616xwtbj2di	14440 WHISKY OLDMOOR DE LUXE LT 1 1,00 BOT 1 9,45		PIECE	\N	2025-11-25 15:04:04.974	2025-11-25 15:04:04.974	\N
gendb7rykh0us3zq7ik8jezd	xxevpbrra70t4616xwtbj2di	14769 WHISKY ROE & CO CL 70 0,70 BOT 1 27,00		L	\N	2025-11-25 15:04:05.63	2025-11-25 15:04:05.63	\N
bueewxomfegud8djp48eqqnf	xxevpbrra70t4616xwtbj2di	14308 WHISKY SOUTHER COMFORT LT.1 1,00 BOT 1 17,63		PIECE	\N	2025-11-25 15:04:06.265	2025-11-25 15:04:06.265	\N
fqvxai7atxlgzsq2cvz5gvwd	xxevpbrra70t4616xwtbj2di	14359 WHISKY TALISKER  SKYE CL.70 0,70 BOT 1 37,50		L	\N	2025-11-25 15:04:06.894	2025-11-25 15:04:06.894	\N
w4xcbbrp7wn4kj4x9w6brslo	xxevpbrra70t4616xwtbj2di	14779 WHISKY TALISKER 10 Y CL 70 0,70 BOT 1 42,60		L	\N	2025-11-25 15:04:07.524	2025-11-25 15:04:07.524	\N
rfar93qapdhwwblelvv7oh64	xxevpbrra70t4616xwtbj2di	14944 WHISKY TALISKER STORM CL 70 0,70 BOT 1 42,00		L	\N	2025-11-25 15:04:08.164	2025-11-25 15:04:08.164	\N
uslndo5y6pmo7qgdwf211wrl	xxevpbrra70t4616xwtbj2di	14173 WHISKY THE BALVENIE 12 ANNI CL  70 0,70 BOT 1 64,50		L	\N	2025-11-25 15:04:08.863	2025-11-25 15:04:08.863	\N
iw74acpf0zre3au7i7c1anyg	xxevpbrra70t4616xwtbj2di	14996 WHISKY THE BUSKER BLEND CL 70 0,70 BOT 1 17,78		L	\N	2025-11-25 15:04:09.492	2025-11-25 15:04:09.492	\N
wgfil1tfr3vomt7eivl87t9i	xxevpbrra70t4616xwtbj2di	14998 WHISKY THE BUSKER S.GRAIN CL  70 0,70 BOT 1 21,38		L	\N	2025-11-25 15:04:10.129	2025-11-25 15:04:10.129	\N
dj59tcnrggmmk8ebzs3wy5io	xxevpbrra70t4616xwtbj2di	14997 WHISKY THE BUSKER S.MALT CL 70 0,70 BOT 1 21,38		L	\N	2025-11-25 15:04:10.763	2025-11-25 15:04:10.763	\N
ffhf1ls452k5w6mxvpwalo5f	xxevpbrra70t4616xwtbj2di	14989 WHISKY TOKINOKA BLENDED WHITE  CL 50 0,50 BOT 1 35,85		L	\N	2025-11-25 15:04:11.409	2025-11-25 15:04:11.409	\N
al2xntwdbknkcp5bi2lj7zxe	xxevpbrra70t4616xwtbj2di	14474 WHISKY TULLAMORE CL 70 0,70 BOT 1 17,10		L	\N	2025-11-25 15:04:12.042	2025-11-25 15:04:12.042	\N
utm20rivdpahwcukl7nq2arw	xxevpbrra70t4616xwtbj2di	14150 WHISKY VAT 69 LT.1 1,00 BOT 1 14,55		PIECE	\N	2025-11-25 15:04:12.674	2025-11-25 15:04:12.674	\N
azyw4rvb7wa1avxka7o9ttje	xxevpbrra70t4616xwtbj2di	14821 WHISKY W.T. LONGBRANCH CL.70 0,70 BOT 1 36,90		L	\N	2025-11-25 15:04:13.317	2025-11-25 15:04:13.317	\N
ym7n95cbmqy3r4sxtca338la	xxevpbrra70t4616xwtbj2di	14100 WHISKY WILD TURKEY 101 CL.70 0,70 BOT 1 27,45		L	\N	2025-11-25 15:04:13.975	2025-11-25 15:04:13.975	\N
fmwn84dfeti38b3q8r0kln57	xxevpbrra70t4616xwtbj2di	14020 WHISKY WILD TURKEY 81 CL.70 0,70 BOT 1 20,18		L	\N	2025-11-25 15:04:14.614	2025-11-25 15:04:14.614	\N
jkzxq98suf0th63wt2epoxvt	xxevpbrra70t4616xwtbj2di	14114 WHISKY WILD TURKEY RARE BREED CL.70 0,70 BOT 1 54,00		L	\N	2025-11-25 15:04:15.245	2025-11-25 15:04:15.245	\N
tk0ayn5edjxc9lkdbcwyzzcy	xxevpbrra70t4616xwtbj2di	14827 WHISKY WILD TURKEY RYE CL 70 0,70 BOT 1 29,70		L	\N	2025-11-25 15:04:15.873	2025-11-25 15:04:15.873	\N
aja0jzl7em89n0u0rj1fwez9	xxevpbrra70t4616xwtbj2di	14028 WHISKY WOODFORD RISERVA CL 70 0,70 BOT 1 33,98		L	\N	2025-11-25 15:04:16.505	2025-11-25 15:04:16.505	\N
bq44fu87v9c1gcmthpbkplra	xxevpbrra70t4616xwtbj2di	14350 ALCOOL EXTRAFINO 95° CL 100 1,00 BOT 1 18,90		PIECE	\N	2025-11-25 15:04:17.139	2025-11-25 15:04:17.139	\N
ulyl70w0fi6q511t8ldynqy2	xxevpbrra70t4616xwtbj2di	14126 ANGOSTURA BITTER CL.20*1 0,20 BOT 1 13,58		PIECE	\N	2025-11-25 15:04:17.768	2025-11-25 15:04:17.768	\N
usac7nc1qe2erdveze1hsm1e	xxevpbrra70t4616xwtbj2di	14113 ANGOSTURA ORANGE BITTER CL.10 0,10 BOT 1 13,35		PIECE	\N	2025-11-25 15:04:18.403	2025-11-25 15:04:18.403	\N
fdlrh6mwbc35g01dydcek2rs	xxevpbrra70t4616xwtbj2di	14163 ANICE VARNELLI LT 1 1,00 BOT 1 21,60		PIECE	\N	2025-11-25 15:04:19.033	2025-11-25 15:04:19.033	\N
t7n29fno00dswx9ao3zkiqhu	xxevpbrra70t4616xwtbj2di	14376 ASSENZIO (VERDE) ABSENTHIA CL 70 0,70 BOT 1 23,25		L	\N	2025-11-25 15:04:19.716	2025-11-25 15:04:19.716	\N
b0t6ky8eprl2ogoes9b5rn9t	xxevpbrra70t4616xwtbj2di	15065 ASSENZIO CLAIR DE LUNE 70 0,70 BOT 1 10,50		L	\N	2025-11-25 15:04:20.347	2025-11-25 15:04:20.347	\N
k0fkfunmhekwm17w3vezglg6	xxevpbrra70t4616xwtbj2di	14230 BAILEYS IRISH CREAM  LITRO 1,00 BOT 1 18,00		PIECE	\N	2025-11-25 15:04:20.975	2025-11-25 15:04:20.975	\N
o5onom810ro1cpvtfav093ft	xxevpbrra70t4616xwtbj2di	14266 BATIDA DE COCO CL.100 1,00 BOT 1 12,90		PIECE	\N	2025-11-25 15:04:21.606	2025-11-25 15:04:21.606	\N
o6q353if3pp29t5v2bdgdy2y	xxevpbrra70t4616xwtbj2di	14032 BITTER TRUTH AROM BITTER OLD T IME CL 20 0,20 BOT 1 18,75		PIECE	\N	2025-11-25 15:04:22.239	2025-11-25 15:04:22.239	\N
gb548r4qr9qra7krhl8059pt	xxevpbrra70t4616xwtbj2di	14185 BITTER TRUTH CELERY CL 20 0,20 BOT 1 18,75		PIECE	\N	2025-11-25 15:04:22.868	2025-11-25 15:04:22.868	\N
y1cb6hvbxegmwq8rl9kz0m1h	xxevpbrra70t4616xwtbj2di	14681 BITTER TRUTH GRAPHE POMP.CL.20 0,20 BOT 1 18,75		PIECE	\N	2025-11-25 15:04:23.501	2025-11-25 15:04:23.501	\N
nybjiopqamewb5b6bnvpis61	xxevpbrra70t4616xwtbj2di	14034 BITTER TRUTH LEMON BITTER CL 20 0,20 BOT 1 18,75		PIECE	\N	2025-11-25 15:04:24.198	2025-11-25 15:04:24.198	\N
uywoi3xnzpg32xata21r1ptr	xxevpbrra70t4616xwtbj2di	14183 BITTER TRUTH ORANGE CL 20 0,20 BOT 1 18,75		PIECE	\N	2025-11-25 15:04:24.83	2025-11-25 15:04:24.83	\N
bci9iu8gsaa1izqgpmse2v4i	xxevpbrra70t4616xwtbj2di	14046 BITTER TRUTH PEACH BITTER CL 20 0,20 BOT 1 18,75		PIECE	\N	2025-11-25 15:04:25.503	2025-11-25 15:04:25.503	\N
q1suo4clgnuxrgdjyyk011kl	xxevpbrra70t4616xwtbj2di	14689 BITTER TRUTH PIMENTO DRAM CL50 0,50 BOT 1 27,00		L	\N	2025-11-25 15:04:26.142	2025-11-25 15:04:26.142	\N
ih3t00vxxqjmr3vfljpx6gzk	xxevpbrra70t4616xwtbj2di	14730 BITTER XOCOLATL FEE BROTHERS ML 150 0,15 BOT 1 19,80		L	\N	2025-11-25 15:04:26.772	2025-11-25 15:04:26.772	\N
nkcapsh3w73irhmhvjhmkulm	xxevpbrra70t4616xwtbj2di	14606 BLUE CURAC.HURRICANE CL 70 0,70 BOT 1 9,00		L	\N	2025-11-25 15:04:27.401	2025-11-25 15:04:27.401	\N
xacktx6qms3mrx0dpvmah3t7	xxevpbrra70t4616xwtbj2di	14592 BOLS BLUE CURACAO CL 70 0,70 BOT 1 10,50		L	\N	2025-11-25 15:04:28.225	2025-11-25 15:04:28.225	\N
hqdsnbw7f23ukt7604yq1cdr	xxevpbrra70t4616xwtbj2di	14889 BOLS ELDEFLOWERS CL 70 0,70 BOT 1 10,50		L	\N	2025-11-25 15:04:29.21	2025-11-25 15:04:29.21	\N
pf5nn1cud6s11f08krw8jvmo	xxevpbrra70t4616xwtbj2di	14597 BOLS LYCHEE CL 70 0,70 BOT 1 10,50		L	\N	2025-11-25 15:04:29.884	2025-11-25 15:04:29.884	\N
qy2vrg5h3ke6v6reurxnmso9	xxevpbrra70t4616xwtbj2di	14594 BOLS MELON CL 70 0,70 BOT 1 10,50		L	\N	2025-11-25 15:04:30.516	2025-11-25 15:04:30.516	\N
z922g8wu3q2350rz29yjn3uu	xxevpbrra70t4616xwtbj2di	14600 BOLS MENTA VERDE CL 70 0,70 BOT 1 10,50		L	\N	2025-11-25 15:04:31.157	2025-11-25 15:04:31.157	\N
futhxuu7lnai2v9zlwvio0li	xxevpbrra70t4616xwtbj2di	14595 BOLS PEACH THREE CL 70 0,70 BOT 1 10,50		L	\N	2025-11-25 15:04:31.859	2025-11-25 15:04:31.859	\N
ja5ti6elx7p9tn1sf268rx11	xxevpbrra70t4616xwtbj2di	14901 CACHACA LEBLON CL 70 0,70 BOT 1 23,25		L	\N	2025-11-25 15:04:32.514	2025-11-25 15:04:32.514	\N
z316n3zv0ljdesri6fizei2l	xxevpbrra70t4616xwtbj2di	14279 CACHACA PIRASSUNUNGA 51 CL 100 1,00 BOT 1 15,75		PIECE	\N	2025-11-25 15:04:33.203	2025-11-25 15:04:33.203	\N
i96tyl68hgvk1tzjldodu3uu	xxevpbrra70t4616xwtbj2di	14135 CACHACA SAGATIBA CL.100 1,00 BOT 1 14,70		PIECE	\N	2025-11-25 15:04:33.962	2025-11-25 15:04:33.962	\N
e62h110ps1rrvcqy46yd9hjm	xxevpbrra70t4616xwtbj2di	14285 CAFFE' BORGHETTI LT. 1 1,00 BOT 1 16,95		PIECE	\N	2025-11-25 15:04:34.595	2025-11-25 15:04:34.595	\N
ypwcnh1d5e54dt8yuxowg1y4	xxevpbrra70t4616xwtbj2di	15029 CHERRY SANGUE MORLACCO LUXARDO  CL 70 0,70 BOT 1 14,25		L	\N	2025-11-25 15:04:35.228	2025-11-25 15:04:35.228	\N
kbsobvnu94j4537r33gfv7fc	xxevpbrra70t4616xwtbj2di	14260 CHERRY STOCK CL.70 0,70 BOT 1 10,65		L	\N	2025-11-25 15:04:35.856	2025-11-25 15:04:35.856	\N
dqgrkwcft0lbrggjrttxq98d	xxevpbrra70t4616xwtbj2di	14182 CHINA CLEMENTI CL 70 0,70 BOT 1 36,15		L	\N	2025-11-25 15:04:36.489	2025-11-25 15:04:36.489	\N
bfr0yte6u57nd8zum6k6j3f8	xxevpbrra70t4616xwtbj2di	14334 DEKUYPER APRICOT CL 70 0,70 BOT 1 12,60		L	\N	2025-11-25 15:04:37.122	2025-11-25 15:04:37.122	\N
uc74hgthru2ocuorna6lh3ac	xxevpbrra70t4616xwtbj2di	14289 DEKUYPER BLU CURACAO CL 70 0,70 BOT 1 12,60		L	\N	2025-11-25 15:04:37.751	2025-11-25 15:04:37.751	\N
dxi4tdy9sdry8cyubyj2ftr6	xxevpbrra70t4616xwtbj2di	14294 DEKUYPER CREMA BANANA CL 70 0,70 BOT 1 12,60		L	\N	2025-11-25 15:04:38.389	2025-11-25 15:04:38.389	\N
hmy1fqoigm1i1l61akqubkcx	xxevpbrra70t4616xwtbj2di	14406 DEKUYPER CREME DE CACAO BIANCA  CL.70 0,70 BOT 1 12,60		L	\N	2025-11-25 15:04:39.02	2025-11-25 15:04:39.02	\N
k45abbn6rpnhcw8a75u7yqx9	xxevpbrra70t4616xwtbj2di	14425 DEKUYPER CREME DE CACAO NERA 0,70 BOT 1 12,60		L	\N	2025-11-25 15:04:39.719	2025-11-25 15:04:39.719	\N
bxt1dta7tt828qzok6b195wt	xxevpbrra70t4616xwtbj2di	14290 DEKUYPER CREME DE CASSIS CL 70 0,70 BOT 1 12,60		L	\N	2025-11-25 15:04:40.352	2025-11-25 15:04:40.352	\N
mff93ygxwgmve5l3x9zmypee	xxevpbrra70t4616xwtbj2di	14429 DEKUYPER DRY ORANGE CL. 70 0,70 BOT 1 12,60		L	\N	2025-11-25 15:04:40.996	2025-11-25 15:04:40.996	\N
ncctvb91wh82bott74btiv4c	xxevpbrra70t4616xwtbj2di	14428 DEKUYPER LYCHEE CL. 70 0,70 BOT 1 13,50		L	\N	2025-11-25 15:04:41.624	2025-11-25 15:04:41.624	\N
ukngoxfo1h5cg2xzrvnxdhht	xxevpbrra70t4616xwtbj2di	14291 DEKUYPER MENTA BIANCA CL 70 0,70 BOT 1 12,60		L	\N	2025-11-25 15:04:42.254	2025-11-25 15:04:42.254	\N
nz4ijicawdhwp7wzry8a0kr9	xxevpbrra70t4616xwtbj2di	14314 DEKUYPER PEACH TREE CL. 70 0,70 BOT 1 12,60		L	\N	2025-11-25 15:04:42.889	2025-11-25 15:04:42.889	\N
qs9s7cv3kvk8jx6rpzljxkqq	xxevpbrra70t4616xwtbj2di	14293 DEKUYPER TRIPLE SEC CL 70 0,70 BOT 1 13,80		L	\N	2025-11-25 15:04:43.527	2025-11-25 15:04:43.527	\N
mhqikjlommvn2u0xlmlm2ncf	xxevpbrra70t4616xwtbj2di	14557 ELISIR GAMBRINUS LT 1 1,00 BOT 1 19,65		PIECE	\N	2025-11-25 15:04:44.156	2025-11-25 15:04:44.156	\N
zvln527slsokg7g7b4q22nau	xxevpbrra70t4616xwtbj2di	14800 GRAND MARNIER CL 70 0,70 BOT 1 20,85		L	\N	2025-11-25 15:04:44.794	2025-11-25 15:04:44.794	\N
x05nknyqtduntv7hf145gnyr	xxevpbrra70t4616xwtbj2di	14836 LIQUORE AGRICANTO CL 70 0,70 BOT 1 13,13		L	\N	2025-11-25 15:04:45.427	2025-11-25 15:04:45.427	\N
oksadgfw4c383n6aj09psm71	xxevpbrra70t4616xwtbj2di	15109 LIQUORE AGRUMINO CORRICELLA CL  70 0,70 BOT 1 15,98		L	\N	2025-11-25 15:04:46.063	2025-11-25 15:04:46.063	\N
wub1jleft364jw9x0d47j4pc	xxevpbrra70t4616xwtbj2di	14683 LIQUORE ANCHO REYES ORIG.CL70 0,70 BOT 1 28,50		L	\N	2025-11-25 15:04:46.7	2025-11-25 15:04:46.7	\N
b1w8gj5t569yp4w2h4pokql5	xxevpbrra70t4616xwtbj2di	14151 LIQUORE AURUM CL.70 0,70 BOT 1 17,25		L	\N	2025-11-25 15:04:47.331	2025-11-25 15:04:47.331	\N
e4rkymtx2dyv1d29lk2ah607	xxevpbrra70t4616xwtbj2di	14054 LIQUORE BENEDICTINE DOM CL 70 0,70 BOT 1 22,50		L	\N	2025-11-25 15:04:47.982	2025-11-25 15:04:47.982	\N
l50fankjn9m8fgx9x1xz8m96	xxevpbrra70t4616xwtbj2di	14496 LIQUORE CALVADOS MORIN *70 0,70 BOT 1 18,23		L	\N	2025-11-25 15:04:48.629	2025-11-25 15:04:48.629	\N
u3t1f8izbj4qaedw5hptweye	xxevpbrra70t4616xwtbj2di	14022 LIQUORE CHAMBORD ROYALE CL.70 0,70 BOT 1 22,88		L	\N	2025-11-25 15:04:49.283	2025-11-25 15:04:49.283	\N
ohotnw4249fj53l6t9pubjj1	xxevpbrra70t4616xwtbj2di	14180 LIQUORE CHARTREUSE GIALLO CL 70 0,70 BOT 1 34,88		L	\N	2025-11-25 15:04:49.91	2025-11-25 15:04:49.91	\N
v949sc4v351thq09kbbky05i	xxevpbrra70t4616xwtbj2di	14331 LIQUORE COINTREAU LT. 1 1,00 BOT 1 26,48		L	\N	2025-11-25 15:04:50.544	2025-11-25 15:04:50.544	\N
nymqugxtz5kw51lsm4wnbw6e	xxevpbrra70t4616xwtbj2di	14612 LIQUORE DAKURAI MELON CL70 0,70 BOT 1 9,00		L	\N	2025-11-25 15:04:51.195	2025-11-25 15:04:51.195	\N
i5ak6xgo18mmltokswdnstgb	xxevpbrra70t4616xwtbj2di	14538 LIQUORE ELDERFLOWER ST.GERMAIN  CL 70 0,70 BOT 1 34,35		L	\N	2025-11-25 15:04:51.833	2025-11-25 15:04:51.833	\N
jknb35qy6cxkr1dhmc99i0lh	xxevpbrra70t4616xwtbj2di	14535 LIQUORE FRANGELICO *70 0,70 BOT 1 13,88		L	\N	2025-11-25 15:04:52.463	2025-11-25 15:04:52.463	\N
xeqim2xivhglprd7jfamithu	xxevpbrra70t4616xwtbj2di	14125 LIQUORE GALLIANO CL.50 0,50 BOT 1 15,30		L	\N	2025-11-25 15:04:53.47	2025-11-25 15:04:53.47	\N
l27otxj8kbo3vziennslu3xt	xxevpbrra70t4616xwtbj2di	14859 LIQUORE GENEPY VALLI OCC.CL 70 0,70 BOT 1 10,50		L	\N	2025-11-25 15:04:54.109	2025-11-25 15:04:54.109	\N
l9uwylb2z7lk79kb9vixjku3	xxevpbrra70t4616xwtbj2di	14992 LIQUORE GENZIANA ROBUSTA CUTIN  A LT 1,00 BOT 1 15,38		PIECE	\N	2025-11-25 15:04:55.106	2025-11-25 15:04:55.106	\N
y6r0oanwp91bhp6unfgvvmym	xxevpbrra70t4616xwtbj2di	14021 LIQUORE HOLLER SAMBUCO CL.70 0,70 BOT 1 14,03		L	\N	2025-11-25 15:04:55.74	2025-11-25 15:04:55.74	\N
ugjdt725py31n8m2wti0a957	xxevpbrra70t4616xwtbj2di	14844 LIQUORE IOVEM CL 70 0,70 BOT 1 19,73		L	\N	2025-11-25 15:04:56.37	2025-11-25 15:04:56.37	\N
mgslnilo3k5zb8h60pnyyyfy	xxevpbrra70t4616xwtbj2di	14725 LIQUORE ISOLABELLA VANIGLIA LT 1,00 BOT 1 13,05		PIECE	\N	2025-11-25 15:04:57.027	2025-11-25 15:04:57.027	\N
yqn1501tff80xa8oa3m40pkk	xxevpbrra70t4616xwtbj2di	14839 LIQUORE ITALICUS BERGAMOTTO CL  70 0,70 BOT 1 31,50		L	\N	2025-11-25 15:04:57.685	2025-11-25 15:04:57.685	\N
twg9ifjq6iqxjlgafl3ab0c2	xxevpbrra70t4616xwtbj2di	14320 LIQUORE KAHLUA CL 100 1,00 BOT 1 18,75		PIECE	\N	2025-11-25 15:04:58.327	2025-11-25 15:04:58.327	\N
xkv94bwd77fdmu63eu5vw217	xxevpbrra70t4616xwtbj2di	14181 LIQUORE LICOR 43 CL 70 0,70 BOT 1 20,70		L	\N	2025-11-25 15:04:58.961	2025-11-25 15:04:58.961	\N
q0d2hv4k42cwl9q0qgorus7w	xxevpbrra70t4616xwtbj2di	14995 LIQUORE LIQUIRIZIA CUTINA LT 1,00 BOT 1 15,38		PIECE	\N	2025-11-25 15:04:59.592	2025-11-25 15:04:59.592	\N
hdd88dibv1brcv0vvid8i62n	xxevpbrra70t4616xwtbj2di	14710 LIQUORE LIQUIRIZIA VENA CL 70 0,70 BOT 1 15,75		L	\N	2025-11-25 15:05:00.224	2025-11-25 15:05:00.224	\N
nqa725kbtfbr2hirsr1gzmc4	xxevpbrra70t4616xwtbj2di	14305 LIQUORE MALIBU CL. 100 1,00 BOT 1 16,20		PIECE	\N	2025-11-25 15:05:00.857	2025-11-25 15:05:00.857	\N
nn9paf3mp04u5wmmolqsjuo8	xxevpbrra70t4616xwtbj2di	15129 LIQUORE MANDARINO CORRICELLA CL 70 0,70 BOT 1 15,98		L	\N	2025-11-25 15:05:01.501	2025-11-25 15:05:01.501	\N
lvjlg411f11k60qfkwd00vdj	xxevpbrra70t4616xwtbj2di	14636 LIQUORE MELA VERDE MARZADRO CL 70 0,70 BOT 1 14,85		L	\N	2025-11-25 15:05:02.138	2025-11-25 15:05:02.138	\N
y6avefp5zq6nci130jip1vug	xxevpbrra70t4616xwtbj2di	15061 LIQUORE MIDORI MELON LT 1 1,00 BOT 1 25,28		L	\N	2025-11-25 15:05:02.778	2025-11-25 15:05:02.778	\N
ldst5o3c75qtsqxf30tuesso	xxevpbrra70t4616xwtbj2di	14709 LIQUORE NOCINO VENA CL 70 0,70 BOT 1 13,95		L	\N	2025-11-25 15:05:03.415	2025-11-25 15:05:03.415	\N
lgjg66a3ru4g1sw62gevmrxe	xxevpbrra70t4616xwtbj2di	14265 LIQUORE PASSOA  LT.1 1,00 BOT 1 15,98		PIECE	\N	2025-11-25 15:05:04.05	2025-11-25 15:05:04.05	\N
nju6b9vzoz8d0a47nhmxjcsa	xxevpbrra70t4616xwtbj2di	14146 LIQUORE PASTIS 51 CL 100 1,00 BOT 1 17,55		PIECE	\N	2025-11-25 15:05:04.69	2025-11-25 15:05:04.69	\N
bbxmhb24p8eut62yhiv3en76	xxevpbrra70t4616xwtbj2di	14227 LIQUORE PERNOD CL 70 0,70 BOT 1 13,95		L	\N	2025-11-25 15:05:05.325	2025-11-25 15:05:05.325	\N
d4uk7qm1covezgqwvvafmc8t	xxevpbrra70t4616xwtbj2di	14716 LIQUORE QUAGLIA BERGAMOTTO CL 70 0,70 BOT 1 21,98		L	\N	2025-11-25 15:05:05.954	2025-11-25 15:05:05.954	\N
vt14fpak97fa2wgpjc0ytx0k	xxevpbrra70t4616xwtbj2di	14674 LIQUORE QUAGLIA CAMOMILLA CL70 0,70 BOT 1 21,98		L	\N	2025-11-25 15:05:06.585	2025-11-25 15:05:06.585	\N
r0a5f41m895ct64509jrocuq	xxevpbrra70t4616xwtbj2di	14705 LIQUORE QUAGLIA CHINOTTO CL70 0,70 BOT 1 21,98		L	\N	2025-11-25 15:05:07.215	2025-11-25 15:05:07.215	\N
klmotuntuctk877qidtppokp	xxevpbrra70t4616xwtbj2di	14706 LIQUORE QUAGLIA CILIEGIA CL70 0,70 BOT 1 21,98		L	\N	2025-11-25 15:05:07.846	2025-11-25 15:05:07.846	\N
gs933gvft9ptxu7xpcxph0mv	xxevpbrra70t4616xwtbj2di	14728 LIQUORE QUAGLIA DOPPIO CARVI CL 70 0,70 BOT 1 22,50		L	\N	2025-11-25 15:05:08.479	2025-11-25 15:05:08.479	\N
ikuit52fzlyao4ld5hpx2hbo	xxevpbrra70t4616xwtbj2di	14704 LIQUORE QUAGLIA PINO MUGO CL70 0,70 BOT 1 21,98		L	\N	2025-11-25 15:05:09.107	2025-11-25 15:05:09.107	\N
yrkwa2daud7g1vx74n5ijvmt	xxevpbrra70t4616xwtbj2di	14717 LIQUORE QUAGLIA RABARBARO CL 70 0,70 BOT 1 21,98		L	\N	2025-11-25 15:05:09.805	2025-11-25 15:05:09.805	\N
ipvbczt9v9n5oht56cmduzug	xxevpbrra70t4616xwtbj2di	14673 LIQUORE QUAGLIA VIOLETTA CL 70 0,70 BOT 1 21,98		L	\N	2025-11-25 15:05:10.436	2025-11-25 15:05:10.436	\N
he256vjusyo1vwwyoawgly0v	xxevpbrra70t4616xwtbj2di	14994 LIQUORE RATAFIA CUTINA LT 1,00 BOT 1 15,38		PIECE	\N	2025-11-25 15:05:11.07	2025-11-25 15:05:11.07	\N
lcrxoqlvnbehz58ece7cvo81	xxevpbrra70t4616xwtbj2di	14642 LIQUORE RATAFIA TOLLO CL 70 0,70 BOT 1 13,88		L	\N	2025-11-25 15:05:11.703	2025-11-25 15:05:11.703	\N
yp610ke14xphny3a89qewyc5	xxevpbrra70t4616xwtbj2di	14432 LIQUORE RICARD CL 70*1 0,70 BOT 1 14,03		L	\N	2025-11-25 15:05:12.333	2025-11-25 15:05:12.333	\N
eqnxbvoyfdzpbnturx2fhsi1	xxevpbrra70t4616xwtbj2di	14685 LIQUORE ROOTS RAKOMELO CL 70 0,70 BOT 1 29,85		L	\N	2025-11-25 15:05:12.96	2025-11-25 15:05:12.96	\N
remxoxpq2g7sjviunjaqjdf2	xxevpbrra70t4616xwtbj2di	14778 LIQUORE SANT'ANTONIO LUXARDO  CL 70 0,70 BOT 1 13,73		L	\N	2025-11-25 15:05:13.594	2025-11-25 15:05:13.594	\N
z7rfzueo5vp1ssplntpmhnmg	xxevpbrra70t4616xwtbj2di	15017 LIQUORE SARURI MELONE VERDE LT 1,00 BOT 1 9,00		PIECE	\N	2025-11-25 15:05:14.264	2025-11-25 15:05:14.264	\N
tnx5o709ecnw7mgyvf921vrx	xxevpbrra70t4616xwtbj2di	14242 LIQUORE STREGA ALBERTI CL. 70 0,70 BOT 1 12,90		L	\N	2025-11-25 15:05:14.895	2025-11-25 15:05:14.895	\N
xe8j20xe05owo7umkfbnuma0	xxevpbrra70t4616xwtbj2di	14353 LIQUORE TIA MARIA CL 70 0,70 BOT 1 15,30		L	\N	2025-11-25 15:05:15.526	2025-11-25 15:05:15.526	\N
ida5ljq8al3pmjhxq812qklp	xxevpbrra70t4616xwtbj2di	14985 LIQUORE TIMO A.GRADAZIONE  CL 70 0,50 BOT 1 17,55		L	\N	2025-11-25 15:05:16.159	2025-11-25 15:05:16.159	\N
u0vqp5r1glkxsvz25cd005dd	xxevpbrra70t4616xwtbj2di	14528 LIQUORE VENTURO CL 70 0,70 BOT 1 19,13		L	\N	2025-11-25 15:05:16.805	2025-11-25 15:05:16.805	\N
jp4648prs5uosjals84wlhdy	xxevpbrra70t4616xwtbj2di	14507 LIQUORE WNK BUTTERSCOTCH 70 0,70 BOT 1 9,75		L	\N	2025-11-25 15:05:17.436	2025-11-25 15:05:17.436	\N
dky02olkpkvsx3gtyeioqaef	xxevpbrra70t4616xwtbj2di	14669 LIQUORE X RATED LT 1 1,00 BOT 1 33,00		PIECE	\N	2025-11-25 15:05:18.073	2025-11-25 15:05:18.073	\N
rydam87kyqroyt9sj900j4my	xxevpbrra70t4616xwtbj2di	14329 LIQUORICE DISTIL. CAFFO  VT CL. 50*1 0,50 BOT 1 13,50		L	\N	2025-11-25 15:05:18.708	2025-11-25 15:05:18.708	\N
sk0cisn4w4f2y7u5e0a6wx92	xxevpbrra70t4616xwtbj2di	14497 MARASCHINO LUXARDO CL 70 0,70 BOT 1 17,55		L	\N	2025-11-25 15:05:19.339	2025-11-25 15:05:19.339	\N
vrr8sbhpmiltb4412zk1zhoe	xxevpbrra70t4616xwtbj2di	14711 MIRTO ROSSO VENA CL 70 0,70 BOT 1 12,45		L	\N	2025-11-25 15:05:19.969	2025-11-25 15:05:19.969	\N
xfrhv7625z4fpfyejlczj2qk	xxevpbrra70t4616xwtbj2di	14522 MIRTO ROSSO ZEDDA PIRAS  0.70 0,70 BOT 1 14,25		L	\N	2025-11-25 15:05:20.601	2025-11-25 15:05:20.601	\N
x3hdbceadsyoly5ov4eoqhzm	xxevpbrra70t4616xwtbj2di	14252 MISTRA PALLINI CL.100 1,00 BOT 1 15,75		PIECE	\N	2025-11-25 15:05:21.233	2025-11-25 15:05:21.233	\N
otqmg2ucw24drgz37v39hjb4	xxevpbrra70t4616xwtbj2di	15114 MONIN LIQ. CREMA CASSIS CL 70 0,70 BOT 1 15,75		L	\N	2025-11-25 15:05:21.871	2025-11-25 15:05:21.871	\N
zzhesfq8iosustfiut3hx658	xxevpbrra70t4616xwtbj2di	14045 MONIN LIQ. CREMA VIOLETTA CL 70 0,70 BOT 1 12,23		L	\N	2025-11-25 15:05:22.518	2025-11-25 15:05:22.518	\N
v1bjro2nwmeishoz52uw8ur9	xxevpbrra70t4616xwtbj2di	14330 NATY'S CRANBERRY LITRO 1,00 BOT 1 5,55		PIECE	\N	2025-11-25 15:05:23.156	2025-11-25 15:05:23.156	\N
hwai482gipgkethheogindc5	xxevpbrra70t4616xwtbj2di	14667 ORANGE STOCK CL.70 0,70 BOT 1 11,25		L	\N	2025-11-25 15:05:23.789	2025-11-25 15:05:23.789	\N
gegpdez9ximawzr1dc07qcan	xxevpbrra70t4616xwtbj2di	14628 PIMM'S CL. 70 0,70 BOT 1 12,38		L	\N	2025-11-25 15:05:24.42	2025-11-25 15:05:24.42	\N
nkgxbg4o5tejm3ryivqx02kt	xxevpbrra70t4616xwtbj2di	14128 PISCO CAPEL ESP.CL.70 0,70 BOT 1 17,10		L	\N	2025-11-25 15:05:25.124	2025-11-25 15:05:25.124	\N
jezq3ne8wsv5vdle5ht7jzf5	xxevpbrra70t4616xwtbj2di	14976 PISCO MACCHU CL 70 0,70 BOT 1 29,10		L	\N	2025-11-25 15:05:25.815	2025-11-25 15:05:25.815	\N
bpbl27fv5wcpt9nbq9fi9bd8	xxevpbrra70t4616xwtbj2di	14262 PUNCH  BARBIERI ARANCIO  LT.1 1,00 BOT 1 12,75		PIECE	\N	2025-11-25 15:05:26.444	2025-11-25 15:05:26.444	\N
iz9k5fb04xrtn935yyjyzlsp	xxevpbrra70t4616xwtbj2di	14347 PUNCH BARBIERI MANDARINO LT 1 1,00 BOT 1 12,75		PIECE	\N	2025-11-25 15:05:27.075	2025-11-25 15:05:27.075	\N
dtpij8axhad71rgkvd1a7beh	xxevpbrra70t4616xwtbj2di	14261 PUNCH RUM BARBIERI LT. 1 1,00 BOT 1 12,75		PIECE	\N	2025-11-25 15:05:27.708	2025-11-25 15:05:27.708	\N
hfx5k8elt41emguj9rwk08sf	xxevpbrra70t4616xwtbj2di	14945 SAKE' SHIRAYUKI CL 75 AST. 0,75 BOT 1 21,38		L	\N	2025-11-25 15:05:28.341	2025-11-25 15:05:28.341	\N
my60mliz3k9wk9ypll69hjqm	xxevpbrra70t4616xwtbj2di	14908 SAKE' YOIGOKOCHI YUZU CL 72 0,72 BOT 1 35,63		L	\N	2025-11-25 15:05:28.972	2025-11-25 15:05:28.972	\N
j4v846a83wflen6blubd8w47	xxevpbrra70t4616xwtbj2di	14847 SAMBUCA CLASSICA DILMOOR LT 1 1,00 BOT 1 10,80		PIECE	\N	2025-11-25 15:05:29.601	2025-11-25 15:05:29.601	\N
gblvwr3er5dasc5a3bjnr7sp	xxevpbrra70t4616xwtbj2di	14488 SAMBUCA GAMONDI LT 1 1,00 BOT 1 12,38		PIECE	\N	2025-11-25 15:05:30.23	2025-11-25 15:05:30.23	\N
tkrtcmvmhrk5ajphgophssv5	xxevpbrra70t4616xwtbj2di	14457 SAMBUCA LUCANO CL 70 0,70 BOT 1 9,90		L	\N	2025-11-25 15:05:30.857	2025-11-25 15:05:30.857	\N
ctr1l2d4nz7qnbl0qt137gjv	xxevpbrra70t4616xwtbj2di	14011 SAMBUCA MOLINARI LT.1*1 1,00 BOT 1 19,88		PIECE	\N	2025-11-25 15:05:31.487	2025-11-25 15:05:31.487	\N
ecfngnr79s2j1b29905tne2e	xxevpbrra70t4616xwtbj2di	14759 SAMBUCA RAMAZZOTTI LT 1 1,00 BOT 1 14,25		PIECE	\N	2025-11-25 15:05:32.181	2025-11-25 15:05:32.181	\N
rg6a9v9vcl71odaqsd0lztfs	xxevpbrra70t4616xwtbj2di	14679 SHERRY PEDRO XIMENEZ HIDALGO CL 75 0,75 BOT 1 25,35		L	\N	2025-11-25 15:05:32.873	2025-11-25 15:05:32.873	\N
pab34s72zkjc9i6ffpfo67ca	xxevpbrra70t4616xwtbj2di	14773 STILLABUNT FIRE BITTER ML100 0,10 BOT 1 18,00		L	\N	2025-11-25 15:05:33.503	2025-11-25 15:05:33.503	\N
lucsqr9qnt2znbbrcgq4ftql	xxevpbrra70t4616xwtbj2di	14907 STILLABUNT FOAMER M.VELV.ML100 0,10 BOT 1 32,25		L	\N	2025-11-25 15:05:34.139	2025-11-25 15:05:34.139	\N
gr118qqq607nanwp0zivp8ch	xxevpbrra70t4616xwtbj2di	14774 STILLABUNT OAK SMOKE ML100 0,10 BOT 1 22,88		L	\N	2025-11-25 15:05:34.78	2025-11-25 15:05:34.78	\N
xesetc0wkwxz0n0s8naz0jzs	xxevpbrra70t4616xwtbj2di	15153 STILLABUNT TIKI BITTER ML100 0,10 BOT 1 13,95		L	\N	2025-11-25 15:05:35.413	2025-11-25 15:05:35.413	\N
sz7ebw0twfrmzzbdurcubdp3	xxevpbrra70t4616xwtbj2di	14498 SUCCO LIMONE RAUCH LT.1 1,00 BOT 1 4,80		PIECE	\N	2025-11-25 15:05:36.051	2025-11-25 15:05:36.051	\N
g6dpe76hhnngp7w8arfh84uv	xxevpbrra70t4616xwtbj2di	14937 TAILS COCKTAIL MOJITO LT 1,00 BOT 1 15,75		PIECE	\N	2025-11-25 15:05:36.693	2025-11-25 15:05:36.693	\N
uasyiu1a5pktwip6r471bpu0	xxevpbrra70t4616xwtbj2di	14781 TIO PEPE SHERRY CL 75 0,75 BOT 1 10,88		L	\N	2025-11-25 15:05:37.324	2025-11-25 15:05:37.324	\N
myngum1qh09cltjzu5sqs9r6	xxevpbrra70t4616xwtbj2di	15013 TRIPLE SEC CAFFO LT 1 1,00 BOT 1 9,00		PIECE	\N	2025-11-25 15:05:37.952	2025-11-25 15:05:37.952	\N
ss0ryrko3whbl0lfomm21yyy	xxevpbrra70t4616xwtbj2di	14607 TRIPLE SEC HURRICANE CL 70 0,70 BOT 1 9,75		L	\N	2025-11-25 15:05:38.587	2025-11-25 15:05:38.587	\N
b8aq7xj0bavbe4e9naolu9zv	xxevpbrra70t4616xwtbj2di	14268 VOV PEZZIOL CL. 70 0,70 BOT 1 10,35		L	\N	2025-11-25 15:05:39.222	2025-11-25 15:05:39.222	\N
mrc3hh8rvlbxiw9or3gtf0f3	xxevpbrra70t4616xwtbj2di	14659 VOV PEZZIOL LT 1 1,00 BOT 1 15,00		PIECE	\N	2025-11-25 15:05:39.85	2025-11-25 15:05:39.85	\N
who11mtwyx3v1dqflxp2pt71	xxevpbrra70t4616xwtbj2di	14478 SALSA WORCESTER ML.150 0,00 BOT 1 4,50		L	\N	2025-11-25 15:05:40.549	2025-11-25 15:05:40.549	\N
stzjp37ct3tdccnuxg7fj4p1	xxevpbrra70t4616xwtbj2di	14410 TABASCO ILHENNY ML. 57 0,00 BOT 1 3,75		L	\N	2025-11-25 15:05:41.181	2025-11-25 15:05:41.181	\N
hl5e8oijdsf5uzt6oxxjpbl0	xxevpbrra70t4616xwtbj2di	14411 CILIEGINE DA COCKTAIL NATY'S GR.470 0,00 PEZ 1 9,15		PIECE	\N	2025-11-25 15:05:41.818	2025-11-25 15:05:41.818	\N
gd7urjrp7tyf4dua0nmzyp19	xxevpbrra70t4616xwtbj2di	12920 VINO AGLIAN. A.TORRI GUARDIENS  E CL25X24 0,25 CRT 24 39,36		BOX	\N	2025-11-25 15:05:42.445	2025-11-25 15:05:42.445	\N
qrsfgm7wl6ebshp4s40aqc6e	xxevpbrra70t4616xwtbj2di	12921 VINO FALANGH. A.TORRI GUARDIEN  SE CL25X24 0,25 CRT 24 39,36		BOX	\N	2025-11-25 15:05:43.107	2025-11-25 15:05:43.107	\N
soxdc6l8hhho1nsm2tl03fot	xxevpbrra70t4616xwtbj2di	12372 Vino Aglian. sannio 375*12 0,38 CRT 12 30,18		BOX	\N	2025-11-25 15:05:43.763	2025-11-25 15:05:43.763	\N
h6yq63o4lacbei4yoz9q1pyx	xxevpbrra70t4616xwtbj2di	12494 VINO AMARONE MASI ML 375*1 0,38 BOT 1 22,87		L	\N	2025-11-25 15:05:44.397	2025-11-25 15:05:44.397	\N
w4fwosmu05pyqixf5ot5n3bu	xxevpbrra70t4616xwtbj2di	12056 vino anthilia donnafugata ML 375*12 0,38 CRT 12 72,59		L	\N	2025-11-25 15:05:45.031	2025-11-25 15:05:45.031	\N
w6qrilcuosgyjji6m6kwcu7b	xxevpbrra70t4616xwtbj2di	12332 VINO BRUNELLO MONT.BANFI CL 375*12 0,38 CRT 12 217,60		BOX	\N	2025-11-25 15:05:45.663	2025-11-25 15:05:45.663	\N
pjqvqkwwjwrt8pgg2kwf4oqr	xxevpbrra70t4616xwtbj2di	12264 VINO CHARD."COLLE MORO" 375*24 0,38 CRT 24 47,60		BOX	\N	2025-11-25 15:05:46.291	2025-11-25 15:05:46.291	\N
sh5cw33lsrqyk16kio7hmmi8	xxevpbrra70t4616xwtbj2di	12742 VINO CHARD.SARA 375*12 LUNA CA SALE 0,37 CRT 12 82,45		BOX	\N	2025-11-25 15:05:46.919	2025-11-25 15:05:46.919	\N
fupqup0jbzx086c9973welqt	xxevpbrra70t4616xwtbj2di	12745 VINO CHARD.VICOLO CORSO 375*12 0,37 CRT 12 34,00		BOX	\N	2025-11-25 15:05:47.547	2025-11-25 15:05:47.547	\N
rafkfcyuaot4dql580sl0e7i	xxevpbrra70t4616xwtbj2di	12366 VINO CHIANTI "ROCCAMURA" 375 X 12 0,38 CRT 12 40,80		BOX	\N	2025-11-25 15:05:48.183	2025-11-25 15:05:48.183	\N
vpypdssg5b19r43dws2zvlgm	xxevpbrra70t4616xwtbj2di	12140 VINO CINCINNATO BELLONE 375*12  CASTORE 0,38 CRT 12 44,20		BOX	\N	2025-11-25 15:05:48.854	2025-11-25 15:05:48.854	\N
cbieuha9hrelrfl5iwein301	xxevpbrra70t4616xwtbj2di	12296 VINO FALANGH SANNIO IGP BEN.ML 375X12 0,38 CRT 12 30,18		L	\N	2025-11-25 15:05:49.488	2025-11-25 15:05:49.488	\N
unaorz2xdovixyp2effu741y	xxevpbrra70t4616xwtbj2di	12112 VINO FALANGH.MASTROBER. 375*12 0,38 CRT 12 56,27		BOX	\N	2025-11-25 15:05:50.127	2025-11-25 15:05:50.127	\N
csag5p6mqfx34mfjninrvc19	xxevpbrra70t4616xwtbj2di	12851 VINO FRASC. CASALE MATTIA 375* 12 0,37 CRT 12 38,25		BOX	\N	2025-11-25 15:05:50.758	2025-11-25 15:05:50.758	\N
btzicsk86k8nq5sljmmcywnz	xxevpbrra70t4616xwtbj2di	12109 VINO GEWURZ.CANT.BOLZA. 375*12 0,38 CRT 12 73,27		BOX	\N	2025-11-25 15:05:51.39	2025-11-25 15:05:51.39	\N
qi13hmdx3hum30n6api7s1k2	xxevpbrra70t4616xwtbj2di	12946 VINO GEWURZ.COLTERENZIO 375*12 0,38 CRT 12 89,85		BOX	\N	2025-11-25 15:05:52.019	2025-11-25 15:05:52.019	\N
m2itfvry43oyk279x51mlimq	xxevpbrra70t4616xwtbj2di	12113 VINO GRECO TUFO MASTROB. 375 *12 0,38 CRT 12 71,74		PIECE	\N	2025-11-25 15:05:52.65	2025-11-25 15:05:52.65	\N
tv8x0kf7m9abgrlbkvas7hm1	xxevpbrra70t4616xwtbj2di	12753 VINO MERLOT VICOLO CORSO 375 *12 0,37 CRT 12 34,00		BOX	\N	2025-11-25 15:05:53.279	2025-11-25 15:05:53.279	\N
g9recz88v6yf7j2dphgnhk9n	xxevpbrra70t4616xwtbj2di	12265 VINO MONTEP. COLLE MORO 375*24 0,38 CRT 24 45,99		BOX	\N	2025-11-25 15:05:53.911	2025-11-25 15:05:53.911	\N
n9w14gytzwjylz0k2el6j0r6	xxevpbrra70t4616xwtbj2di	12108 VINO MULLER TH.C.BOLZANO 375 *12 0,38 CRT 12 59,93		BOX	\N	2025-11-25 15:05:54.54	2025-11-25 15:05:54.54	\N
h7th1ym52t9o68oikffhjw5r	xxevpbrra70t4616xwtbj2di	12141 VINO NERO BUONO CINCINNATO 375 *12 POLLUCE 0,38 CRT 12 44,20		BOX	\N	2025-11-25 15:05:55.238	2025-11-25 15:05:55.238	\N
rtlfioe196feqybkv058i1m8	xxevpbrra70t4616xwtbj2di	12383 VINO PECORINO "TOLLO" ML375X12 0,38 CRT 12 31,20		L	\N	2025-11-25 15:05:55.872	2025-11-25 15:05:55.872	\N
cv7jpcalqtuf9khnmk76vpun	xxevpbrra70t4616xwtbj2di	12026 VINO PINOT GRIGIO COLLEMORO ML 375*24 0,38 CRT 24 43,78		PIECE	\N	2025-11-25 15:05:56.517	2025-11-25 15:05:56.517	\N
y5jn9ice3fza4hhmsj7b646c	xxevpbrra70t4616xwtbj2di	12008 VINO ROSSO MONT.BANFI 375*12 0,38 CRT 12 93,50		BOX	\N	2025-11-25 15:05:57.152	2025-11-25 15:05:57.152	\N
cegvhfahgg647bmhkoo1hzqy	xxevpbrra70t4616xwtbj2di	12245 VINO SATRICO CL 375*12 0,38 CRT 12 76,25		BOX	\N	2025-11-25 15:05:57.782	2025-11-25 15:05:57.782	\N
wrdrz8ukix8j16bqdyvkd2rz	xxevpbrra70t4616xwtbj2di	12269 VINO SHIRAZ C.GIGLIO 375*12 0,38 CRT 12 82,45		BOX	\N	2025-11-25 15:05:58.424	2025-11-25 15:05:58.424	\N
ws369wgjz6xn4xur8qzu5511	xxevpbrra70t4616xwtbj2di	12240 VINO VERM.CUC.MANCINI 375*12 0,38 CRT 12 75,65		BOX	\N	2025-11-25 15:05:59.058	2025-11-25 15:05:59.058	\N
qw5147bngoyfi17un73q1oks	xxevpbrra70t4616xwtbj2di	12645 VINO  P.GRIGIO RAMATO" ATTEMS"  75*6 0,75 CRT 6 64,77		L	\N	2025-11-25 15:05:59.689	2025-11-25 15:05:59.689	\N
vqyj4th4hmti1y7b7jra9haq	xxevpbrra70t4616xwtbj2di	12224 VINO  SILVANER ISARCO "CANT. BOLZANO" CL75*6 0,75 CRT 6 60,78		L	\N	2025-11-25 15:06:00.329	2025-11-25 15:06:00.329	\N
ofkcayml3a97ru70j7huit3p	xxevpbrra70t4616xwtbj2di	12867 VINO AGLIAN. IGP BENEV. FREMON DO 75X6 0,75 CRT 6 18,87		L	\N	2025-11-25 15:06:00.963	2025-11-25 15:06:00.963	\N
gm9lpbucfcnwofxmnlswqryh	xxevpbrra70t4616xwtbj2di	12895 VINO AGLIANICO DOP FREM.GUARDI ENSE 75X6 0,75 CRT 6 31,45		L	\N	2025-11-25 15:06:01.594	2025-11-25 15:06:01.594	\N
qdq4yqgmocnpslf3ka106v77	xxevpbrra70t4616xwtbj2di	12101 VINO AGLIANICO SIGILLO CANTINA  NOTAIO CL75X1 0,75 BOT 1 39,10		L	\N	2025-11-25 15:06:02.226	2025-11-25 15:06:02.226	\N
li41uq91me15obqwrg4w2mh0	xxevpbrra70t4616xwtbj2di	12911 VINO ALESSANDRO "LUNA CASALE"  CL75*1 0,75 BOT 1 11,48		L	\N	2025-11-25 15:06:02.852	2025-11-25 15:06:02.852	\N
y2vq3xrtfaolkimdgw6y0d3q	xxevpbrra70t4616xwtbj2di	12672 VINO ALTENI BRASSICA  "GAJA"  CL 75*1 0,75 BOT 1 99,45		L	\N	2025-11-25 15:06:03.485	2025-11-25 15:06:03.485	\N
tiffxhkolv9hr4j2avuh0j2p	xxevpbrra70t4616xwtbj2di	12785 VINO AMARONE "REIUS SARTORI"   CL 75 *1 0,75 BOT 1 23,97		L	\N	2025-11-25 15:06:04.118	2025-11-25 15:06:04.118	\N
p1uwf0ompvh0h5dpnmf7xhqh	xxevpbrra70t4616xwtbj2di	12271 VINO AMARONE MASI CL 75*1 0,75 BOT 1 38,25		L	\N	2025-11-25 15:06:04.748	2025-11-25 15:06:04.748	\N
sevd0njv3lz2zlq6xv7p1g9h	xxevpbrra70t4616xwtbj2di	12577 VINO ANTHILIA "DONNAFUGATA"  CL 75 X 6 0,75 CRT 6 60,78		L	\N	2025-11-25 15:06:05.38	2025-11-25 15:06:05.38	\N
h8ublem2j172nh4mwh7aqe32	xxevpbrra70t4616xwtbj2di	12335 VINO ANTINOO CASALE DEL GIGLIO CL 75*6 0,75 CRT 6 87,13		L	\N	2025-11-25 15:06:06.023	2025-11-25 15:06:06.023	\N
kdb1b6h1azo4h9jc6z8wwt1o	xxevpbrra70t4616xwtbj2di	12907 VINO APPASSIMENTO ROSSO PUGLIA APRIMONDO CL 75X6 0,75 CRT 6 38,25		L	\N	2025-11-25 15:06:06.656	2025-11-25 15:06:06.656	\N
vqqc91ius38uemuzrgu2hsf7	xxevpbrra70t4616xwtbj2di	12496 VINO APPASSIMENTO"COLLEFRISIO"  CL 75*1 0,75 BOT 1 8,76		L	\N	2025-11-25 15:06:07.287	2025-11-25 15:06:07.287	\N
nad42i95kwuwwqsdibx1vc9w	xxevpbrra70t4616xwtbj2di	13024 VINO ARNEIS BASTIA "RISERVA" DOCG CL 75*1 0,75 BOT 1 10,88		L	\N	2025-11-25 15:06:07.924	2025-11-25 15:06:07.924	\N
dcm6zqpttu9b2y4rb8uv3ny9	xxevpbrra70t4616xwtbj2di	13023 VINO ARNEIS BASTIA DOCG  CL 75*6 0,75 CRT 6 49,73		L	\N	2025-11-25 15:06:08.559	2025-11-25 15:06:08.559	\N
tnxomlpw90iunl1x95p3l9tg	xxevpbrra70t4616xwtbj2di	12924 VINO AUTOKTONA B.CO VILLA VASI CL 75*6 0,75 CRT 6 54,40		L	\N	2025-11-25 15:06:09.198	2025-11-25 15:06:09.198	\N
qzhm2u12a3x5ek84l6c3509t	xxevpbrra70t4616xwtbj2di	12282 VINO BACCAROSSA POGGIO VOLPI CL 75 X 6 0,75 CRT 6 104,13		L	\N	2025-11-25 15:06:09.823	2025-11-25 15:06:09.823	\N
owv57tv5zpwg5gga2y4mvt08	xxevpbrra70t4616xwtbj2di	12817 VINO BALTATO ROSE' PIOMBAIA  75*6 0,75 CRT 6 56,53		L	\N	2025-11-25 15:06:10.524	2025-11-25 15:06:10.524	\N
d9ap7goqm7mzo52ezz6i7rtz	xxevpbrra70t4616xwtbj2di	12673 VINO BARBARESCO 2017 CL75  "GAJA" 0,75 BOT 1 181,90		L	\N	2025-11-25 15:06:11.186	2025-11-25 15:06:11.186	\N
dpe9qav7h46i0rbjwq4vpmff	xxevpbrra70t4616xwtbj2di	12574 VINO BARBARESCO VERMILIUM DOCG  "TERRE BAROLO" CL75*1 0,75 BOT 1 19,38		L	\N	2025-11-25 15:06:11.878	2025-11-25 15:06:11.878	\N
fzydg1zw3f0zqy8md47gncms	xxevpbrra70t4616xwtbj2di	12796 VINO BARBERA ALBA REVERDITO BU TTI CL75X6 0,75 CRT 6 53,81		L	\N	2025-11-25 15:06:12.506	2025-11-25 15:06:12.506	\N
tr8s6ytiwrfkpt2nt8y3rfwz	xxevpbrra70t4616xwtbj2di	12150 VINO BARBERA D'ALBA ROND.TERRE  B.CL75X6 0,75 CRT 6 33,32		L	\N	2025-11-25 15:06:13.141	2025-11-25 15:06:13.141	\N
wvkymet19152dymx5et9kuz8	xxevpbrra70t4616xwtbj2di	12858 VINO BARBERA EMILIA DAL FIUME  CL 75 X 6 0,75 CRT 6 18,28		L	\N	2025-11-25 15:06:13.771	2025-11-25 15:06:13.771	\N
chjpk00sxnssjyx3ozo1z2sg	xxevpbrra70t4616xwtbj2di	12809 VINO BAROLO ASCHERI CL 75*1 0,75 BOT 1 34,43		L	\N	2025-11-25 15:06:14.397	2025-11-25 15:06:14.397	\N
sj3yogkgolqbt994zsqgsmbe	xxevpbrra70t4616xwtbj2di	12597 VINO BAROLO DOCG BUSSIA C.MARR  ONE CL75*1 0,75 BOT 1 54,83		L	\N	2025-11-25 15:06:15.031	2025-11-25 15:06:15.031	\N
cun60okvupxajwjb7sib13kr	xxevpbrra70t4616xwtbj2di	12800 VINO BAROLO DOCG REVERDITO CL 75 X 1 0,75 BOT 1 20,66		L	\N	2025-11-25 15:06:15.663	2025-11-25 15:06:15.663	\N
cm5378gl5hled5b05no4ejh4	xxevpbrra70t4616xwtbj2di	12462 VINO BAROLO DOCG TERRE BAROLO  CL 75 X 1 0,75 BOT 1 20,57		L	\N	2025-11-25 15:06:16.298	2025-11-25 15:06:16.298	\N
r80u0wq28bfmfzpsreoswnnh	xxevpbrra70t4616xwtbj2di	12784 VINO BAROLO RISERVA 2016 REVER DITO CL 75*1 0,75 BOT 1 82,45		L	\N	2025-11-25 15:06:16.935	2025-11-25 15:06:16.935	\N
ddb6q81j89b8idagq4xnt9k6	xxevpbrra70t4616xwtbj2di	12138 VINO BELLONE CASTORE "CINCINNA TO" 75*6 0,75 CRT 6 36,98		L	\N	2025-11-25 15:06:17.569	2025-11-25 15:06:17.569	\N
unntn227bhxqr8rsp0jx0shu	xxevpbrra70t4616xwtbj2di	12882 VINO BELLONE RADIX CL 75*1 0,75 BOT 1 45,05		L	\N	2025-11-25 15:06:18.206	2025-11-25 15:06:18.206	\N
jzki0mnravsva0zjl72viwc4	xxevpbrra70t4616xwtbj2di	12917 VINO BIANCO VERONESE MARANI CL 75*6 0,75 CRT 6 51,51		L	\N	2025-11-25 15:06:18.84	2025-11-25 15:06:18.84	\N
q0l07zoc1377f50eb3z2opnf	xxevpbrra70t4616xwtbj2di	12664 VINO BIANCOLELLA ISCHIA "CASA  D'AMBRA" CL 75*6 0,75 CRT 6 84,75		L	\N	2025-11-25 15:06:19.472	2025-11-25 15:06:19.472	\N
u8bsi84mufgxej6utc6oj5lt	xxevpbrra70t4616xwtbj2di	12463 VINO BLANGE' ARNEIS CERETTO DOC CL 75*1 0,75 BOT 1 19,55		L	\N	2025-11-25 15:06:20.104	2025-11-25 15:06:20.104	\N
gi7wu7lx8wvldp8vh191wmgq	xxevpbrra70t4616xwtbj2di	12831 VINO BOLGHERI DOC "MICH.SATTA"  CL 75*1 0,75 BOT 1 20,83		L	\N	2025-11-25 15:06:20.729	2025-11-25 15:06:20.729	\N
flb4hk3qdeng7hu326iw4v1f	xxevpbrra70t4616xwtbj2di	12682 VINO BOURG.ROUGE "J.FEUILLET"  CL 75 0,75 BOT 1 27,20		L	\N	2025-11-25 15:06:21.363	2025-11-25 15:06:21.363	\N
fb94ntjiqfhdjq172v6ulesh	xxevpbrra70t4616xwtbj2di	12464 VINO BRUCIATO ROSSO ANT.CL75X1 0,75 BOT 1 23,38		L	\N	2025-11-25 15:06:21.995	2025-11-25 15:06:21.995	\N
xf45oazm29z3m705lmkkstia	xxevpbrra70t4616xwtbj2di	13006 VINO BRUN.POGGIO ORO'16 BANFI CL 75*1 0,75 BOT 1 121,13		L	\N	2025-11-25 15:06:22.624	2025-11-25 15:06:22.624	\N
r7wxtvgmhhdffed72fdyedwh	xxevpbrra70t4616xwtbj2di	13028 VINO BRUNELLO BIONDI SANTI 2017 CL 75*1 0,75 BOT 1 235,45		L	\N	2025-11-25 15:06:23.262	2025-11-25 15:06:23.262	\N
tx9ky0czj97evbnr23dqdu88	xxevpbrra70t4616xwtbj2di	12969 VINO BRUNELLO FALORNI CL 75*1 0,75 BOT 1 30,60		L	\N	2025-11-25 15:06:23.893	2025-11-25 15:06:23.893	\N
lqbtxzzbvyhu1zre6hxpopxb	xxevpbrra70t4616xwtbj2di	12815 VINO BRUNELLO MONT. PIOMBAIA  75*1 0,75 BOT 1 30,60		L	\N	2025-11-25 15:06:24.527	2025-11-25 15:06:24.527	\N
aq96wdk0nfwub6et1t5c4oys	xxevpbrra70t4616xwtbj2di	12465 VINO BRUNELLO MONT.BANFI CL 75*1 0,75 BOT 1 32,73		L	\N	2025-11-25 15:06:25.16	2025-11-25 15:06:25.16	\N
ax5h7tiunsj2mmry7liw67dn	xxevpbrra70t4616xwtbj2di	13020 VINO CABERN/SAUV. TERRE DI RAI CL 75*6 0,75 CRT 6 24,48		L	\N	2025-11-25 15:06:25.856	2025-11-25 15:06:25.856	\N
fs74jcy5r4djumya7xsus2ja	xxevpbrra70t4616xwtbj2di	12546 VINO CABERN/SAUVIGN"ZORZETTIG"  CL.75X6 0,75 CRT 6 46,33		L	\N	2025-11-25 15:06:26.486	2025-11-25 15:06:26.486	\N
mh92fru5frn4nzf5n0n5iffj	xxevpbrra70t4616xwtbj2di	12328 VINO CABERNET FRANC FERNANDA C APP.CL 75*6 0,75 CRT 6 24,48		L	\N	2025-11-25 15:06:27.118	2025-11-25 15:06:27.118	\N
kmpdkojzoz9bwnkniqzco20a	xxevpbrra70t4616xwtbj2di	12646 Vino Cannonau Falcale"Mancini"  CL 75X1 0,75 BOT 1 10,37		L	\N	2025-11-25 15:06:27.751	2025-11-25 15:06:27.751	\N
wxs88g02k3yyb1kdr2cvk8c6	xxevpbrra70t4616xwtbj2di	12450 VINO CANNONAU RAIGHINAS "GREGU " CL 75X6 0,75 CRT 6 54,40		L	\N	2025-11-25 15:06:28.414	2025-11-25 15:06:28.414	\N
x8c8d8f2gdginmhcej6twxan	xxevpbrra70t4616xwtbj2di	12065 VINO CAPICHERA VEND. TARDIVA IGT 0.75*1 0,75 BOT 1 64,60		L	\N	2025-11-25 15:06:29.047	2025-11-25 15:06:29.047	\N
yujibltcsia4212hjc37tg3x	xxevpbrra70t4616xwtbj2di	12466 VINO CAPICHERA VIGNA 'NGENA DOCG CL.75*1 0,75 BOT 1 31,96		L	\N	2025-11-25 15:06:29.681	2025-11-25 15:06:29.681	\N
jsyt4lbfbat1f16aqmm51036	xxevpbrra70t4616xwtbj2di	12758 VINO CAPOLEMOLE BELLONE  "CARPINETI"CL75X6 0,75 CRT 6 56,87		L	\N	2025-11-25 15:06:30.308	2025-11-25 15:06:30.308	\N
nn48y0rkbmkfafs3oiku1ohs	xxevpbrra70t4616xwtbj2di	12759 VINO CAPOLEMOLE ROSSO  "CARPINETI" CL75X6 0,75 CRT 6 74,97		L	\N	2025-11-25 15:06:30.941	2025-11-25 15:06:30.941	\N
cylf1xru6x78m6j52zvex2fv	xxevpbrra70t4616xwtbj2di	12023 VINO CARIGNANO SULCIS LIBALTAI  SA RAJA "CL 75*1 0,75 BOT 1 11,73		L	\N	2025-11-25 15:06:31.638	2025-11-25 15:06:31.638	\N
yflaltp5vfamfigxdejeyen5	xxevpbrra70t4616xwtbj2di	12214 VINO CERASUOLO IDEALE "PETRINI " CL 75*6 0,75 CRT 6 49,64		L	\N	2025-11-25 15:06:32.272	2025-11-25 15:06:32.272	\N
nz9nii7elx69wx1lmktnu06u	xxevpbrra70t4616xwtbj2di	12330 VINO CERVARO DELLA SALA CL75*1 ANTINORI 0,75 BOT 1 63,75		L	\N	2025-11-25 15:06:32.907	2025-11-25 15:06:32.907	\N
ncewdng8n90h9re0lkfypyx7	xxevpbrra70t4616xwtbj2di	12791 VINO CESANESE "VAJOSCURO"TEREN  ZI DOCG RIS.CL 75X6 0,75 CRT 6 70,98		L	\N	2025-11-25 15:06:33.537	2025-11-25 15:06:33.537	\N
m7unbota507nea0qoxr7zaji	xxevpbrra70t4616xwtbj2di	12790 VINO CESANESE "VELOBRA"TERENZI  DOCG 75X6 0,75 CRT 6 35,87		L	\N	2025-11-25 15:06:34.169	2025-11-25 15:06:34.169	\N
hcq1lsj9qhj84e93cdmq1w28	xxevpbrra70t4616xwtbj2di	12251 VINO CHARD. "COLLEMORO"CL.75X6 0,75 CRT 6 19,55		L	\N	2025-11-25 15:06:34.801	2025-11-25 15:06:34.801	\N
ae7skdj7yb8b516ofybiizhh	xxevpbrra70t4616xwtbj2di	12944 VINO CHARD. LAFOA COLTERENZIO CL 75*1 0,75 BOT 1 27,20		L	\N	2025-11-25 15:06:35.44	2025-11-25 15:06:35.44	\N
hiikxo61klbwun89wa2wpszb	xxevpbrra70t4616xwtbj2di	12869 VINO CHARD. PRIMADONNA CL.75X6 0,75 CRT 6 43,35		L	\N	2025-11-25 15:06:36.07	2025-11-25 15:06:36.07	\N
wm8f141yeqlgodv0idyo3zn0	xxevpbrra70t4616xwtbj2di	12725 VINO CHARD. SARA "LUNA DEL  CASALE" CL75*6 0,75 CRT 6 64,09		L	\N	2025-11-25 15:06:36.701	2025-11-25 15:06:36.701	\N
anfw4i4u8pif0wdjb2jqmcif	xxevpbrra70t4616xwtbj2di	13027 VINO CHARD. VICOLO NEL CORSO CL 75X6 0,75 CRT 6 22,27		L	\N	2025-11-25 15:06:37.334	2025-11-25 15:06:37.334	\N
ks98rt5k84hbjeoinhen2e4n	xxevpbrra70t4616xwtbj2di	12007 VINO CHARD."CAS. DEL GIGLIO" C L 75*6 0,75 CRT 6 53,38		L	\N	2025-11-25 15:06:37.968	2025-11-25 15:06:37.968	\N
dgeai1drqbsq4frzcihnpkmi	xxevpbrra70t4616xwtbj2di	12966 VINO CHARD.CURTEFRANCA CA BOSC O CL 75*1 0,75 BOT 1 66,73		L	\N	2025-11-25 15:06:38.599	2025-11-25 15:06:38.599	\N
ydm1quyg28qixjb2cxyl83xv	xxevpbrra70t4616xwtbj2di	12135 VINO CHARDON. NOSTRVM LOCANDA CL 75*6 0,75 CRT 6 25,50		L	\N	2025-11-25 15:06:39.228	2025-11-25 15:06:39.228	\N
jiuxehjclq7jotmycdt7yy35	xxevpbrra70t4616xwtbj2di	12238 VINO CHARDON.KLEINSTEIN CANT.B OLZ. CL 75*1 0,75 BOT 1 11,65		L	\N	2025-11-25 15:06:39.856	2025-11-25 15:06:39.856	\N
g0flo6ovucpr2jfbia4lgvxt	xxevpbrra70t4616xwtbj2di	12820 VINO CHARDONNAY  ST.PAULS 75*6 0,75 CRT 6 50,58		L	\N	2025-11-25 15:06:40.489	2025-11-25 15:06:40.489	\N
gzf378h213xkibofkbsre3fd	xxevpbrra70t4616xwtbj2di	12538 VINO CHARDONNAY "ZORZETTIG"  CL.75X6 0,75 CRT 6 46,33		L	\N	2025-11-25 15:06:41.19	2025-11-25 15:06:41.19	\N
rkg1i54eycsjef2h98by08ua	xxevpbrra70t4616xwtbj2di	12885 VINO CHARDONNAY BACCICHETTO  CL 75*6 0,75 CRT 6 30,26		L	\N	2025-11-25 15:06:41.819	2025-11-25 15:06:41.819	\N
pd1g5p5z7qglljonn0hwqy8n	xxevpbrra70t4616xwtbj2di	12237 VINO CHARDONNAY CANT.BOLZANO CL75*6 0,75 CRT 6 52,87		L	\N	2025-11-25 15:06:42.456	2025-11-25 15:06:42.456	\N
jtge7o1ew00swf6vnrxlfrw9	xxevpbrra70t4616xwtbj2di	12739 VINO CHARDONNAY CILE"EMILIANA"   CL 75*6 0,75 CRT 6 49,73		L	\N	2025-11-25 15:06:43.084	2025-11-25 15:06:43.084	\N
v1gxf3vjm2bkic4rxy0o95pr	xxevpbrra70t4616xwtbj2di	12939 VINO CHARDONNAY COLTERENZIO CL 75*6 0,75 CRT 6 58,14		L	\N	2025-11-25 15:06:43.714	2025-11-25 15:06:43.714	\N
aevixibfepkuc7efiigd9ucq	xxevpbrra70t4616xwtbj2di	12324 VINO CHARDONNAY FERN.CAPPELLO CL 75*6 0,75 CRT 6 24,48		L	\N	2025-11-25 15:06:44.351	2025-11-25 15:06:44.351	\N
yto1ua2cy6p347979xca4gh2	xxevpbrra70t4616xwtbj2di	12468 VINO CHARDONNAY JERMANN CL.75*1 0,75 BOT 1 20,40		L	\N	2025-11-25 15:06:44.978	2025-11-25 15:06:44.978	\N
mgv6hjjjc6zvt0l3ma5eqby4	xxevpbrra70t4616xwtbj2di	12978 VINO CHARDONNAY LA RASENNA CL  75X6 0,75 CRT 6 20,83		L	\N	2025-11-25 15:06:45.611	2025-11-25 15:06:45.611	\N
q276fxx58mvfev8m8u6myj9d	xxevpbrra70t4616xwtbj2di	12976 VINO CHARDONNAY S.VALENTIN  "ST.MICHELE" 75*1 0,75 BOT 1 31,11		L	\N	2025-11-25 15:06:46.253	2025-11-25 15:06:46.253	\N
j9l83qye76gf3e304g0emx3v	xxevpbrra70t4616xwtbj2di	12880 VINO CHARDONNAY TERRE DI RAI CL 75*6 0,75 CRT 6 24,48		L	\N	2025-11-25 15:06:46.889	2025-11-25 15:06:46.889	\N
d1zliqklxqgf57m9ntd36jmz	xxevpbrra70t4616xwtbj2di	12505 VINO CHARD-ZIBIBBO FATASCIA' CL 75X6 0,75 CRT 6 30,60		L	\N	2025-11-25 15:06:47.52	2025-11-25 15:06:47.52	\N
ek62u8os04uq2t5z0niw7ddt	xxevpbrra70t4616xwtbj2di	12168 VINO CHIANTI CASTIGL."FRESCOBA LDI" CL 75 X 1 0,75 BOT 1 7,99		L	\N	2025-11-25 15:06:48.155	2025-11-25 15:06:48.155	\N
c6fey4uxs22x61s46jqcf7ut	xxevpbrra70t4616xwtbj2di	12641 VINO CHIANTI CLASS. PERANO  "FRESCOBALDI" CL 75*1 0,75 BOT 1 13,60		L	\N	2025-11-25 15:06:48.787	2025-11-25 15:06:48.787	\N
li5toonxmduopvochpn3zh5b	xxevpbrra70t4616xwtbj2di	12155 VINO CHIANTI CLASSICO "CORTE A L BIGIO" CL. 75*6 0,75 CRT 6 39,53		L	\N	2025-11-25 15:06:49.428	2025-11-25 15:06:49.428	\N
npqlr6u04jekduse5cgd7353	xxevpbrra70t4616xwtbj2di	12951 VINO CHIANTI CLASSICO FALORNI  CL 75X6 0,75 CRT 6 46,75		L	\N	2025-11-25 15:06:50.058	2025-11-25 15:06:50.058	\N
ukzxki1s01cpxq2avk33zn7g	xxevpbrra70t4616xwtbj2di	12017 VINO CHIANTI DOCG "CORTE BIGIO " CL 75X6 0,75 CRT 6 28,22		L	\N	2025-11-25 15:06:50.691	2025-11-25 15:06:50.691	\N
asnkwo2bn6c4qdcojwmo7gbq	xxevpbrra70t4616xwtbj2di	13008 VINO CHIANTI DOCG BANFI ANNATA  CL 75X6 0,75 CRT 6 42,93		L	\N	2025-11-25 15:06:51.32	2025-11-25 15:06:51.32	\N
z7ql9oct0v6yeavl8xos87wr	xxevpbrra70t4616xwtbj2di	12950 VINO CHIANTI DOCG FALORNI  CL 75X6 0,75 CRT 6 31,03		L	\N	2025-11-25 15:06:51.954	2025-11-25 15:06:51.954	\N
rdozg4zv3prs28gbw3q228ou	xxevpbrra70t4616xwtbj2di	12525 VINO CHIANTI NIPOZZANO RIS.  "FRESCOBALDI" CL75X6 0,75 CRT 6 89,68		L	\N	2025-11-25 15:06:52.59	2025-11-25 15:06:52.59	\N
mlsf118b4w6kt8qe3jcu6awh	xxevpbrra70t4616xwtbj2di	12699 VINO CHIANTI ROCCAMURA DOCG RI S. CL 75*6 0,75 CRT 6 28,90		L	\N	2025-11-25 15:06:53.224	2025-11-25 15:06:53.224	\N
ntlno44x89wr3dsg1kvh8czx	xxevpbrra70t4616xwtbj2di	12139 VINO CINCINNATO NERO BUONO(POLLUCE) 75X6 0,75 CRT 6 36,98		L	\N	2025-11-25 15:06:53.857	2025-11-25 15:06:53.857	\N
wp41oxe7drgq0w9gayecqvzu	xxevpbrra70t4616xwtbj2di	12900 VINO COLLEF.SEMIS BARR.M.PULC. CL75*1 0,75 BOT 1 16,58		L	\N	2025-11-25 15:06:54.492	2025-11-25 15:06:54.492	\N
z7u6gh68kkuc6b2ttw1ehvsk	xxevpbrra70t4616xwtbj2di	12498 VINO CONFRONTO BIANCO RIS.  "COLLEFRISIO" CL75*1 0,75 BOT 1 9,44		L	\N	2025-11-25 15:06:55.126	2025-11-25 15:06:55.126	\N
fbmkzrd0h7so1gisjiooej58	xxevpbrra70t4616xwtbj2di	12499 VINO CONFRONTO ROSSO  "COLLEFRISIO" CL75*1 0,75 BOT 1 11,31		L	\N	2025-11-25 15:06:55.758	2025-11-25 15:06:55.758	\N
swsoescqfa9o0zt4lu3g28mh	xxevpbrra70t4616xwtbj2di	12461 VINO CONTE VIPERA ANTIN.CL75X1 0,75 BOT 1 29,24		L	\N	2025-11-25 15:06:56.459	2025-11-25 15:06:56.459	\N
gsw7boakxtzbl2st004kvrr7	xxevpbrra70t4616xwtbj2di	12179 VINO CORVO ROSSO CL 75*6 SALAPARUTA 0,75 CRT 6 31,71		L	\N	2025-11-25 15:06:57.09	2025-11-25 15:06:57.09	\N
k9o4dptz1fdjrk5l4k4dqtfm	xxevpbrra70t4616xwtbj2di	12783 VINO COSTA D' AMALFI BIANCO CL 75*1 0,75 BOT 1 19,55		L	\N	2025-11-25 15:06:57.724	2025-11-25 15:06:57.724	\N
p5w0964vzcfnxqhc2uhmwkcg	xxevpbrra70t4616xwtbj2di	12874 VINO CUM LAUDE ROSSO BANFI  CL 75*1 0,75 BOT 1 17,68		L	\N	2025-11-25 15:06:58.352	2025-11-25 15:06:58.352	\N
c3vs0qnjnyhm1e1gvuqdsqhk	xxevpbrra70t4616xwtbj2di	12846 VINO CUVEE' ST.PAULS BIANCO  CL 75*6 0,75 CRT 6 39,61		L	\N	2025-11-25 15:06:58.983	2025-11-25 15:06:58.983	\N
w5h8b1if006892pgh7uwimwx	xxevpbrra70t4616xwtbj2di	12095 VINO DE LADOUCETTE POUILLY FUM E' CL 75*1 0,75 BOT 1 38,25		L	\N	2025-11-25 15:06:59.614	2025-11-25 15:06:59.614	\N
m5t6q6hwqrmn2775rhepjqz3	xxevpbrra70t4616xwtbj2di	12149 VINO DOLCETTO D'ALBA "TERRE DE L BAROLO" CL 75X6 0,75 CRT 6 32,05		L	\N	2025-11-25 15:07:00.248	2025-11-25 15:07:00.248	\N
mbba7rcpvief090sk4uflb4l	xxevpbrra70t4616xwtbj2di	12469 VINO DONNA GIOVANNA IUZZOLINI CL 75X1 0,75 BOT 1 17,26		L	\N	2025-11-25 15:07:00.901	2025-11-25 15:07:00.901	\N
djipi8o2pgsm6gp92nrnxdpy	xxevpbrra70t4616xwtbj2di	12281 VINO DONNALUCE "P.LE VOLPI" BO NUS LAZIO KM 0 75*6 0,75 CRT 6 78,20		L	\N	2025-11-25 15:07:01.561	2025-11-25 15:07:01.561	\N
f1qlsivamgkyke81v5wmap5h	xxevpbrra70t4616xwtbj2di	12492 VINO DONO PIOMBAIA  75*1 0,75 BOT 1 50,58		L	\N	2025-11-25 15:07:02.193	2025-11-25 15:07:02.193	\N
xhxn8sftbn07o0jxwzefunys	xxevpbrra70t4616xwtbj2di	12775 VINO EST EST EST POGGIO GELSI "FALESCO" 2023 75 CL 0,75 CRT 6 55,59		L	\N	2025-11-25 15:07:02.82	2025-11-25 15:07:02.82	\N
uzux6rqu3zr6ku3t6bym5m56	xxevpbrra70t4616xwtbj2di	12563 VINO ETNA BIANCO PETRALAVA  "A. VINAI" CL75X6 0,75 CRT 6 69,53		L	\N	2025-11-25 15:07:03.451	2025-11-25 15:07:03.451	\N
edf6vevd7yij287t8cmp38k7	xxevpbrra70t4616xwtbj2di	12564 VINO ETNA ROSSO PETRALAVA  "ANT.VINAI" CL75X6 0,75 CRT 6 69,53		L	\N	2025-11-25 15:07:04.082	2025-11-25 15:07:04.082	\N
oqjsj0amp133igsve1a6h0mw	xxevpbrra70t4616xwtbj2di	12862 VINO FALANGH."DOP" SANNIO FREM ONDO 75X6 0,75 CRT 6 31,45		L	\N	2025-11-25 15:07:04.722	2025-11-25 15:07:04.722	\N
ce3kjf4luclwbwv9mwp18pgz	xxevpbrra70t4616xwtbj2di	12865 VINO FALANGH.IGP BENEV. FREMON DO 75X6 0,75 CRT 6 18,87		L	\N	2025-11-25 15:07:05.356	2025-11-25 15:07:05.356	\N
r1xcnp269dm7p0cl9mhxonwj	xxevpbrra70t4616xwtbj2di	12231 VINO FALANGH.IRPINIA "HISTORIA  ANT" CL75*6 0,75 CRT 6 34,85		L	\N	2025-11-25 15:07:05.989	2025-11-25 15:07:05.989	\N
snr1mbv1a9uqi54nyo1f4tyv	xxevpbrra70t4616xwtbj2di	12749 VINO FALANGHINA "FEUDI SAN  GREGORIO" CL.75*6 0,75 CRT 6 55,85		L	\N	2025-11-25 15:07:06.618	2025-11-25 15:07:06.618	\N
qhlwlxd2cbqt37zpog12usfi	xxevpbrra70t4616xwtbj2di	12210 VINO FALANGHINA MASTROBER. DOC  CL.75*6 0,75 CRT 6 51,00		L	\N	2025-11-25 15:07:07.248	2025-11-25 15:07:07.248	\N
bko5fhsbv15ku89d0c9n7mml	xxevpbrra70t4616xwtbj2di	12437 VINO FALANGHINA VIGNAQ "COLLEF RISIO" CL 75*6 0,75 CRT 6 35,36		L	\N	2025-11-25 15:07:07.878	2025-11-25 15:07:07.878	\N
mtuj3wcfu347ehqcbhw1dip5	xxevpbrra70t4616xwtbj2di	12111 VINO FIANO AV.MASTROBER. DOCG CL 75X6 0,75 CRT 6 59,93		L	\N	2025-11-25 15:07:08.511	2025-11-25 15:07:08.511	\N
got76t88ejrurujpsmbdo4wu	xxevpbrra70t4616xwtbj2di	12751 VINO FIANO AVELLINO DOC  "FEUDI S,GREGORIO" CL.75*6 0,75 CRT 6 63,75		L	\N	2025-11-25 15:07:09.156	2025-11-25 15:07:09.156	\N
be0cy9xltc7cwt0c3yc3bm90	xxevpbrra70t4616xwtbj2di	12308 VINO FIANO AVELLINO H.A. DOCG CL 75 X 6 0,75 CRT 6 44,37		L	\N	2025-11-25 15:07:09.79	2025-11-25 15:07:09.79	\N
rox0bue2296uc7bbgbb830nr	xxevpbrra70t4616xwtbj2di	12965 VINO FIORDUVA FUR.M.CUOMO B.CO CL 75*1 0,75 BOT 1 58,31		L	\N	2025-11-25 15:07:10.423	2025-11-25 15:07:10.423	\N
zpwnqqj12bopjbzq7arjgwmk	xxevpbrra70t4616xwtbj2di	12401 VINO FRAGOLINO ROSSO BOTTEGA C L 75X6 0,75 CRT 6 33,83		L	\N	2025-11-25 15:07:11.053	2025-11-25 15:07:11.053	\N
f301ydialjrp4p3sa36e2srq	xxevpbrra70t4616xwtbj2di	0,700 lt  DLD007		L	\N	2025-11-25 15:11:19.283	2025-11-25 15:11:19.283	\N
t0ropoou9qw3rymhrkf9av0e	xxevpbrra70t4616xwtbj2di	12848 VINO FRASC. DOC CASALE MATTIA  75*6 0,75 CRT 6 29,58		L	\N	2025-11-25 15:07:11.757	2025-11-25 15:07:11.757	\N
edlurfvt68zvta2i84vwfwcm	xxevpbrra70t4616xwtbj2di	12015 VINO FRASC. SUP.PEOPLE DOCG"PO GGIO LE VOLPI" 75*6 0,75 CRT 6 30,77		L	\N	2025-11-25 15:07:12.387	2025-11-25 15:07:12.387	\N
tic0cef01fuf5lg21llsufeu	xxevpbrra70t4616xwtbj2di	12638 VINO FRASC."ANFIT.TUSCOLANO"  BONUS LAZIO KM 0 75*6 0,75 CRT 6 20,83		L	\N	2025-11-25 15:07:13.084	2025-11-25 15:07:13.084	\N
qg0n1apnzi7jqpbn7w1b8e91	xxevpbrra70t4616xwtbj2di	12847 VINO FRASCATI SUP. DOCG CASALE  MATTIA 75*6 TERRE LAVIGHE 0,75 CRT 6 40,80		L	\N	2025-11-25 15:07:13.807	2025-11-25 15:07:13.807	\N
q5an3b8aj11rx12otkqktknw	xxevpbrra70t4616xwtbj2di	12539 VINO FRIULANO "ZORZETTIG"  CL. 75*6 0,75 CRT 6 46,33		L	\N	2025-11-25 15:07:14.444	2025-11-25 15:07:14.444	\N
ibvqgvepo4hoexdnr02et7pj	xxevpbrra70t4616xwtbj2di	12964 VINO FURORE MARISA CUOMO B.CO CL 75*1 0,75 BOT 1 29,33		L	\N	2025-11-25 15:07:15.318	2025-11-25 15:07:15.318	\N
x7etscfxv212bgy42awbsndf	xxevpbrra70t4616xwtbj2di	12804 VINO GATTINARA "TRAVAGLINI" NE BBIOLO CL 75*1 0,75 BOT 1 28,90		L	\N	2025-11-25 15:07:15.95	2025-11-25 15:07:15.95	\N
xn88o6qqpkdmbrnnb0njha53	xxevpbrra70t4616xwtbj2di	12001 VINO GAVI PRINCIPESSA G.BANFI CL75X6 0,75 CRT 6 53,72		L	\N	2025-11-25 15:07:16.609	2025-11-25 15:07:16.609	\N
hmu8188zqb1bw75oxgm5v0is	xxevpbrra70t4616xwtbj2di	12840 VINO GEWURZTR ALSACE"LOUIS SCH  ERBE" 2021 CL 75 0,75 BOT 1 18,28		L	\N	2025-11-25 15:07:17.264	2025-11-25 15:07:17.264	\N
a5arfqt25m27qr1a0xufxtcs	xxevpbrra70t4616xwtbj2di	12857 VINO GEWURZTR."JUSTINA"   ST.PAULS 75*1 0,75 BOT 1 11,65		L	\N	2025-11-25 15:07:17.894	2025-11-25 15:07:17.894	\N
k3hrdgifxqhx646rrwk21p7i	xxevpbrra70t4616xwtbj2di	12938 VINO GEWURZTRAM. COLTERENZIO CL 75*6 0,75 CRT 6 68,85		L	\N	2025-11-25 15:07:18.526	2025-11-25 15:07:18.526	\N
btgsgxs5pdhnsenpmyf21bkt	xxevpbrra70t4616xwtbj2di	12517 VINO GEWURZTRAMINER "TREMISSE"  CL75X 6 0,75 CRT 6 25,16		L	\N	2025-11-25 15:07:19.153	2025-11-25 15:07:19.153	\N
bx5u732myo1k92rm2zyheqcl	xxevpbrra70t4616xwtbj2di	12199 VINO GEWURZTRAMINER CESLAR"CAN T.BOLZANO" 75*6 0,75 CRT 6 63,75		L	\N	2025-11-25 15:07:19.783	2025-11-25 15:07:19.783	\N
muon93twacodhjs59z56r4pa	xxevpbrra70t4616xwtbj2di	12740 VINO GEWURZTRAMINER NATURA CIL  E"EMILIANA" CL75*6 0,75 CRT 6 49,73		L	\N	2025-11-25 15:07:20.441	2025-11-25 15:07:20.441	\N
cvgejf963ndsvsbfi4p7ve2q	xxevpbrra70t4616xwtbj2di	12433 VINO GEWURZTRAMINER S.MICHELE APPIANO 75X6 0,75 CRT 6 90,53		L	\N	2025-11-25 15:07:21.077	2025-11-25 15:07:21.077	\N
gu9g6b4rckbhv4kvtu5svyvh	xxevpbrra70t4616xwtbj2di	12788 VINO GEWURZTRAMINER S.VALENTIN  CL 75X1 0,75 BOT 1 31,11		L	\N	2025-11-25 15:07:21.709	2025-11-25 15:07:21.709	\N
d7wa921kroz5ydwbq41chn2o	xxevpbrra70t4616xwtbj2di	12819 VINO GEWURZTRAMINER ST.PAULS  75*6 0,75 CRT 6 61,88		L	\N	2025-11-25 15:07:22.337	2025-11-25 15:07:22.337	\N
e7lnm7p4vhrilbiy62d1fmth	xxevpbrra70t4616xwtbj2di	12968 VINO GEWURZTRAMINER TUZKO CL 75*6 0,75 CRT 6 40,38		L	\N	2025-11-25 15:07:22.975	2025-11-25 15:07:22.975	\N
t4lqia2h7yuyglujatb9nm2s	xxevpbrra70t4616xwtbj2di	12037 VINO GEWUSTRAMINER KLEINSTEIN CL.75*1 0,75 BOT 1 14,20		L	\N	2025-11-25 15:07:23.614	2025-11-25 15:07:23.614	\N
q4glazdmkvrt3zgrw61vjoem	xxevpbrra70t4616xwtbj2di	12922 VINO GOVERNO ROSSO FALORNI CL 75X6 0,75 CRT 6 39,53		L	\N	2025-11-25 15:07:24.242	2025-11-25 15:07:24.242	\N
l3xnsdql4wwjsh5x0fvb8ngy	xxevpbrra70t4616xwtbj2di	12983 VINO GRECANTE GRECHETTO  "CAPRAI" CL 75X1 0,75 BOT 1 11,90		L	\N	2025-11-25 15:07:24.873	2025-11-25 15:07:24.873	\N
cswo0v6lnyg7399berbv8tbj	xxevpbrra70t4616xwtbj2di	13017 VINO GRECANTE GRECHETTO COLLI  MARTANI CL 75X1 0,75 BOT 1 11,05		L	\N	2025-11-25 15:07:25.507	2025-11-25 15:07:25.507	\N
wgecd9shaiez4kaaa3tc1dox	xxevpbrra70t4616xwtbj2di	12693 VINO GRECHETTO MONTEFALCO B.CO  DOC "CAPRAI" CL75X6 0,75 CRT 6 50,58		L	\N	2025-11-25 15:07:26.143	2025-11-25 15:07:26.143	\N
tms5oc2px4fesye5ka8fv4y2	xxevpbrra70t4616xwtbj2di	12110 VINO GRECO DI TUFO MASTROBER DOCG CL75X6 0,75 CRT 6 59,93		L	\N	2025-11-25 15:07:26.846	2025-11-25 15:07:26.846	\N
fgxwbykk7phrznp9gxkdgaso	xxevpbrra70t4616xwtbj2di	12866 VINO GRECO DOC FREM.GUARDIENSE   75X6 0,75 CRT 6 33,83		L	\N	2025-11-25 15:07:27.475	2025-11-25 15:07:27.475	\N
zyasrv34lvzubkm52vilee4i	xxevpbrra70t4616xwtbj2di	12750 VINO GRECO TUFO DOCG  "FEUDI SAN GREGORIO" CL.75*6 0,75 CRT 6 63,75		L	\N	2025-11-25 15:07:28.11	2025-11-25 15:07:28.11	\N
p7ypahxm2xgrnqqf1evolw1r	xxevpbrra70t4616xwtbj2di	12232 VINO GRECO TUFO DOCG "HISTORIA  ANTIQUA" 75*6 0,75 CRT 6 44,37		L	\N	2025-11-25 15:07:28.744	2025-11-25 15:07:28.744	\N
p3ph4z8kemh1psi8oto81czp	xxevpbrra70t4616xwtbj2di	12436 VINO GRIGNOLINO VITA TERRE BAR CL 75X6 0,75 CRT 6 36,55		L	\N	2025-11-25 15:07:29.38	2025-11-25 15:07:29.38	\N
zss2zfo05ndq94ror7mpqvz7	xxevpbrra70t4616xwtbj2di	12569 VINO GRILLO "ARCHINA'" CL75X6 0,75 CRT 6 27,20		L	\N	2025-11-25 15:07:30.01	2025-11-25 15:07:30.01	\N
bc6z2hkft1i2nz55vnz1rbo4	xxevpbrra70t4616xwtbj2di	12561 VINO GRILLO SCIARE EST  "ANTICHI VINAI" CL 75X6 0,75 CRT 6 31,96		L	\N	2025-11-25 15:07:30.642	2025-11-25 15:07:30.642	\N
lpzr0k0cg2yqitanstnml4uu	xxevpbrra70t4616xwtbj2di	12929 VINO ISELIS BIANCO ARGIOLAS  CL 75X1 0,75 BOT 1 15,90		L	\N	2025-11-25 15:07:31.381	2025-11-25 15:07:31.381	\N
j6hpjs92jkej1q4i34wfg5k0	xxevpbrra70t4616xwtbj2di	12452 VINO KERNER CANTINA BOLZANO CL  75*6 0,75 CRT 6 64,35		L	\N	2025-11-25 15:07:32.01	2025-11-25 15:07:32.01	\N
wm63n4dcul64n23vflthd2va	xxevpbrra70t4616xwtbj2di	12120 VINO KIKE'TRAMIN-A/SAUV. FINA CL75X6 0,75 CRT 6 63,24		L	\N	2025-11-25 15:07:32.64	2025-11-25 15:07:32.64	\N
bchp06s6dy98qavdca2n52sp	xxevpbrra70t4616xwtbj2di	12368 VINO LACRIMA MORRO RUBICO MARO TTI C.CL75X6 0,75 CRT 6 39,70		L	\N	2025-11-25 15:07:33.272	2025-11-25 15:07:33.272	\N
q91hvac0hhdfvedlorrygbw3	xxevpbrra70t4616xwtbj2di	12122 VINO LAGREIN CANT.BOLZANO CL 75 X 6 0,75 CRT 6 59,25		L	\N	2025-11-25 15:07:33.907	2025-11-25 15:07:33.907	\N
h573px0t8lqs07d29j0t8gz6	xxevpbrra70t4616xwtbj2di	12941 VINO LAGREIN COLTERENZIO CL 75*6 0,75 CRT 6 68,85		L	\N	2025-11-25 15:07:34.54	2025-11-25 15:07:34.54	\N
s3apaykdunqjos5f3fnf9gao	xxevpbrra70t4616xwtbj2di	12612 VINO LAGREIN TABER  "C.BOLZANO" CL 75*1 0,75 BOT 0 34,51		L	\N	2025-11-25 15:07:35.172	2025-11-25 15:07:35.172	\N
lq47fmeodzry20s1di1ilnko	xxevpbrra70t4616xwtbj2di	12549 VINO LAMBR. EMILIA BIO  "AURAMADRE" CL.75X6 0,75 CRT 6 27,63		L	\N	2025-11-25 15:07:35.803	2025-11-25 15:07:35.803	\N
e3lxwdt6am08m4d71b772inu	xxevpbrra70t4616xwtbj2di	12774 VINO LR COLTERENZIO CL 75*1 0,75 BOT 1 105,40		L	\N	2025-11-25 15:07:36.466	2025-11-25 15:07:36.466	\N
xo8y5hrhezbd3nco8lscqpbq	xxevpbrra70t4616xwtbj2di	12655 VINO LUCE DELLA VITE  "FRESCOBALDI"  CL 75*1 0,75 BOT 1 125,38		L	\N	2025-11-25 15:07:37.093	2025-11-25 15:07:37.093	\N
wisyx4ze7cbusfw0bg0jfkn2	xxevpbrra70t4616xwtbj2di	12708 VINO LUGANA "CA DEI FRATI"  75*6 0,75 CRT 6 67,32		L	\N	2025-11-25 15:07:37.732	2025-11-25 15:07:37.732	\N
tqoj0t7ke0qinugkayfqlq8j	xxevpbrra70t4616xwtbj2di	12780 VINO LUGANA "LA MUSINA SARTORI  " CL 75*6 0,75 CRT 6 56,70		L	\N	2025-11-25 15:07:38.361	2025-11-25 15:07:38.361	\N
a374cf9ntzhqqcbth99xaa2r	xxevpbrra70t4616xwtbj2di	12711 VINO LUGANA BORGHETTA RIS. AVA NZI CL 75*1 0,75 BOT 1 14,45		L	\N	2025-11-25 15:07:38.996	2025-11-25 15:07:38.996	\N
kav0zehpu1vnr55wfkljdhbf	xxevpbrra70t4616xwtbj2di	12709 VINO LUGANA SIRMIONE AVANZI CL  75*6 0,75 CRT 6 56,95		L	\N	2025-11-25 15:07:39.627	2025-11-25 15:07:39.627	\N
sc24w06k2zxdydi2ok9r09s4	xxevpbrra70t4616xwtbj2di	12410 VINO LUMARE IUZZOLINI CL 75X6 0,75 CRT 6 46,75		L	\N	2025-11-25 15:07:40.262	2025-11-25 15:07:40.262	\N
vhx8fq9xpl3vgoowg28vw7e8	xxevpbrra70t4616xwtbj2di	12724 VINO LUNARIO"LUNA DEL CASALE"  CL75X 6 0,75 CRT 6 40,29		L	\N	2025-11-25 15:07:40.892	2025-11-25 15:07:40.892	\N
d9htmzaf7uytbjr9xx2gc1pq	xxevpbrra70t4616xwtbj2di	12267 VINO MACERATO PIOMBAIA CL 75  75*1 0,75 BOT 1 16,58		L	\N	2025-11-25 15:07:41.526	2025-11-25 15:07:41.526	\N
uofgovta8tgukc6euat2j860	xxevpbrra70t4616xwtbj2di	12409 VINO MADRE GOCCIA IUZZOLINI CL 75X6 0,75 CRT 6 46,75		L	\N	2025-11-25 15:07:42.234	2025-11-25 15:07:42.234	\N
eaowvo87f1g8y5wvtu31qhlm	xxevpbrra70t4616xwtbj2di	12852 VINO MALVASIA B.CA DODICI E ME ZZO CL 75X6 0,75 CRT 6 32,30		L	\N	2025-11-25 15:07:42.864	2025-11-25 15:07:42.864	\N
sd4ff1233y3vrt6500cy0e9y	xxevpbrra70t4616xwtbj2di	12473 VINO MATER MATUTA C.GIGLIO CL 75*1 0,75 BOT 1 45,05		L	\N	2025-11-25 15:07:43.494	2025-11-25 15:07:43.494	\N
s70wns2bormuvxqj9b8btlpv	xxevpbrra70t4616xwtbj2di	12602 VINO MATI' LA RASENNA CL 75*1 0,75 BOT 1 12,75		L	\N	2025-11-25 15:07:44.128	2025-11-25 15:07:44.128	\N
b49rhgl7wxiibxbllmil48ge	xxevpbrra70t4616xwtbj2di	12545 VINO MERLOT "ZORZETTIG"  CL. 75X6 0,75 CRT 6 46,33		L	\N	2025-11-25 15:07:44.763	2025-11-25 15:07:44.763	\N
j55oo42xz8wr46e46jbikdlz	xxevpbrra70t4616xwtbj2di	12883 VINO MERLOT BACCICHETTO  CL.75*6 0,75 CRT 6 30,26		L	\N	2025-11-25 15:07:45.393	2025-11-25 15:07:45.393	\N
tc7lo1ujnt3vnpinksrnmdl3	xxevpbrra70t4616xwtbj2di	12404 VINO MERLOT CASALE DEL GIGLIO CL.75*6 0,75 CRT 6 50,32		L	\N	2025-11-25 15:07:46.053	2025-11-25 15:07:46.053	\N
cr8coump0za408gn8cg7namq	xxevpbrra70t4616xwtbj2di	12894 VINO MERLOT FILARI ITA.RASENNA CL 75 X 6 0,75 CRT 6 20,83		L	\N	2025-11-25 15:07:46.682	2025-11-25 15:07:46.682	\N
dhyjj46ft4iztmzo8v9p14ju	xxevpbrra70t4616xwtbj2di	12777 VINO MERLOT MONTIANO "COTARELL  A" 75*1 0,75 BOT 1 45,31		L	\N	2025-11-25 15:07:47.318	2025-11-25 15:07:47.318	\N
otbwp333gj385o2hazyitf1r	xxevpbrra70t4616xwtbj2di	12160 VINO MERLOT NOSTRVM LOCANDA CL 75*6 0,75 CRT 6 25,50		L	\N	2025-11-25 15:07:47.957	2025-11-25 15:07:47.957	\N
tk8cf7z8ywkdmu63ts6l9g23	xxevpbrra70t4616xwtbj2di	12490 VINO MERLOT PIOMBAIA 75*6 0,75 CRT 6 50,58		L	\N	2025-11-25 15:07:48.592	2025-11-25 15:07:48.592	\N
x3dk6i78i9nckvkcdz0qezqj	xxevpbrra70t4616xwtbj2di	12283 VINO MERLOT PLENILUNIO LUNA CASALE 75X6 0,75 CRT 6 40,29		L	\N	2025-11-25 15:07:49.223	2025-11-25 15:07:49.223	\N
g0vc349mbynisghcqcqs2fc5	xxevpbrra70t4616xwtbj2di	12776 VINO MERLOT SODALE "COTARELLA"   75*1 0,75 BOT 1 17,00		L	\N	2025-11-25 15:07:49.86	2025-11-25 15:07:49.86	\N
qodjubxm5pxyyhl1es83c4jc	xxevpbrra70t4616xwtbj2di	13026 VINO MERLOT VICOLO NEL CORSO CL 75 X 6 0,75 CRT 6 22,27		L	\N	2025-11-25 15:07:50.497	2025-11-25 15:07:50.497	\N
yrp4jdkpef4q7cfd0zd5b3tu	xxevpbrra70t4616xwtbj2di	12755 VINO MILLE E UNA NOTTE ROSSO CL 75 0,75 BOT 1 62,05		L	\N	2025-11-25 15:07:51.124	2025-11-25 15:07:51.124	\N
o87aamqolvx5ukb7plphizq6	xxevpbrra70t4616xwtbj2di	12648 VINO MIRAVAL ROSE' CL 75 X 1 0,75 BOT 1 15,56		L	\N	2025-11-25 15:07:51.763	2025-11-25 15:07:51.763	\N
j68m7wrw3tx8zjnjgdsj8v4d	xxevpbrra70t4616xwtbj2di	12692 VINO MONTEFALCO ROSSO DOC  "A.CAPRAI" 75X6 0,75 CRT 6 59,93		L	\N	2025-11-25 15:07:53.11	2025-11-25 15:07:53.11	\N
ehdthix4ia8rg5n9kgmchnqd	xxevpbrra70t4616xwtbj2di	12145 VINO MONTEP. "MO"  TOLLO CL 75 X6 0,75 CRT 6 52,45		L	\N	2025-11-25 15:07:54.115	2025-11-25 15:07:54.115	\N
vg42dyi2xuie2vodpxcwa2po	xxevpbrra70t4616xwtbj2di	12552 VINO MONTEP.D'ABR. BIO  "AURAMADRE" CL.75X6 0,75 CRT 6 28,05		L	\N	2025-11-25 15:07:54.75	2025-11-25 15:07:54.75	\N
aq33hm7pjxoa5rvza9nrm9id	xxevpbrra70t4616xwtbj2di	12260 VINO MONTEP.D'ABR."COLLEMORO" 0.75*6 0,75 CRT 6 19,55		L	\N	2025-11-25 15:07:55.423	2025-11-25 15:07:55.423	\N
exieafxrgyn2digf0kmrv7b6	xxevpbrra70t4616xwtbj2di	12211 VINO MONTEPULCIANO SENZA ALIBI  "PETRINI" CL 75*6 0,75 CRT 6 49,64		L	\N	2025-11-25 15:07:56.056	2025-11-25 15:07:56.056	\N
tajbmrmsv7zuomk781a7u5to	xxevpbrra70t4616xwtbj2di	12364 VINO MORELLINO SCAN.GUADALMARE "CORTE BIGIO" CL 75X6 0,75 CRT 6 39,36		L	\N	2025-11-25 15:07:56.701	2025-11-25 15:07:56.701	\N
wlrkrbuknc57wodc3e124zlk	xxevpbrra70t4616xwtbj2di	12904 VINO MORO "CARPINETI"  CL 75x1 0,75 BOT 1 14,28		L	\N	2025-11-25 15:07:57.333	2025-11-25 15:07:57.333	\N
cd6ogj9ah4zhh8wx5zqc59i8	xxevpbrra70t4616xwtbj2di	12878 VINO MOSCATO G.  PFEFFERER COL TERENZIO CL 75*6 0,75 CRT 6 55,08		L	\N	2025-11-25 15:07:57.969	2025-11-25 15:07:57.969	\N
jz5952do1ni0mbrelpl3izhj	xxevpbrra70t4616xwtbj2di	12823 VINO MOSCATO GIALLO  ST.PAULS  75*6 0,75 CRT 6 55,51		L	\N	2025-11-25 15:07:58.605	2025-11-25 15:07:58.605	\N
mimepju9e7tnke95kldrj4vo	xxevpbrra70t4616xwtbj2di	12890 VINO MOSCATO NOTTE D' ESTATE  TERRE B. CL 75*6 0,75 CRT 6 53,13		L	\N	2025-11-25 15:07:59.263	2025-11-25 15:07:59.263	\N
isnrajjxp2mrmwsttn1e77oj	xxevpbrra70t4616xwtbj2di	12117 VINO MOSS LA RASENNA CL 75 X 6 0,75 CRT 6 38,76		L	\N	2025-11-25 15:07:59.899	2025-11-25 15:07:59.899	\N
tjh603n80umzh89z1ix23l8d	xxevpbrra70t4616xwtbj2di	12886 VINO MULLER THURG. BACCICHETTO  CL 75*6 0,75 CRT 6 30,26		L	\N	2025-11-25 15:08:00.535	2025-11-25 15:08:00.535	\N
e52xfueizlfppa90y2ru7dpb	xxevpbrra70t4616xwtbj2di	12198 VINO MULLER THURGAU CANTINA BOLZ. 0.75*6 0,75 CRT 6 50,32		L	\N	2025-11-25 15:08:01.169	2025-11-25 15:08:01.169	\N
mjnnajmcbzqumqi9qgpdey2i	xxevpbrra70t4616xwtbj2di	12821 VINO MULLER THURGAU ST.PAULS  75*6 0,75 CRT 6 50,58		L	\N	2025-11-25 15:08:01.809	2025-11-25 15:08:01.809	\N
fgmzq9k8mk2me55viuqw2b0c	xxevpbrra70t4616xwtbj2di	12738 VINO NATURA ROSSO CILE SY MUE  "EMILIANA" 75*6 0,75 CRT 6 49,73		L	\N	2025-11-25 15:08:02.448	2025-11-25 15:08:02.448	\N
z4qhg353117t6kmgfphilozm	xxevpbrra70t4616xwtbj2di	12792 VINO NEBBIOLO REVERDITO SIMAN E CL 75X6 0,75 CRT 6 53,81		L	\N	2025-11-25 15:08:03.079	2025-11-25 15:08:03.079	\N
roem5se4rx6fh9htjw6m1onx	xxevpbrra70t4616xwtbj2di	12151 VINO NEBBIOLO ROND.TERRE B. CL  75 X 6 0,75 CRT 6 34,51		L	\N	2025-11-25 15:08:03.726	2025-11-25 15:08:03.726	\N
vc7n2xbgbui29rhuabemytzl	xxevpbrra70t4616xwtbj2di	12807 VINO NEBBIOLO SASSELLA  "RAINOLDI"CL75X1 0,75 BOT 1 17,26		L	\N	2025-11-25 15:08:04.359	2025-11-25 15:08:04.359	\N
qkhrlrmb62n264sff0cwhd8u	xxevpbrra70t4616xwtbj2di	12154 VINO NEGROAMARO CELEBRATION EM ERA QUARTA CL 75X6 0,75 CRT 6 34,00		L	\N	2025-11-25 15:08:04.992	2025-11-25 15:08:04.992	\N
vyfeq6mavugqul6lxbne60mz	xxevpbrra70t4616xwtbj2di	12853 VINO NEGROAMARO DODICI E MEZZO  CL 75 X 6 0,75 CRT 6 32,30		L	\N	2025-11-25 15:08:05.628	2025-11-25 15:08:05.628	\N
tlrjhunxc66om5yvlxg9kewx	xxevpbrra70t4616xwtbj2di	12567 VINO NERO D' AVOLA "ARCHINA'"  CL 75X6 0,75 CRT 6 30,60		L	\N	2025-11-25 15:08:06.265	2025-11-25 15:08:06.265	\N
a0p8qfysqg2bjzfo2m0541jy	xxevpbrra70t4616xwtbj2di	12752 VINO NERO D' AVOLA CHIAROMONTE  "FIRRIATO" CL75X6 0,75 CRT 6 63,24		L	\N	2025-11-25 15:08:06.895	2025-11-25 15:08:06.895	\N
b8o8r6wo5tje9605w4uco9v5	xxevpbrra70t4616xwtbj2di	12731 VINO NERO D' AVOLA"MORGANTE"  CL75X6 0,75 CRT 6 53,21		L	\N	2025-11-25 15:08:07.537	2025-11-25 15:08:07.537	\N
f7i0p0qleue9t86n9gaayz8w	xxevpbrra70t4616xwtbj2di	12562 VINO NERO D'AVOLA SCIARE EST  "ANT.VINAI" CL75X6 0,75 CRT 6 31,96		L	\N	2025-11-25 15:08:08.272	2025-11-25 15:08:08.272	\N
wb8q8fn4jd5r69rdhkiiodao	xxevpbrra70t4616xwtbj2di	12801 VINO NOBILE MONTEP."POLIZIANO"  CL75X1 0,75 BOT 1 17,00		L	\N	2025-11-25 15:08:08.93	2025-11-25 15:08:08.93	\N
o40vec5vkzpqesiz374oakqc	xxevpbrra70t4616xwtbj2di	12556 VINO NZU BELLONE CARPINETI CL CL75X1 0,75 BOT 1 25,33		L	\N	2025-11-25 15:08:09.563	2025-11-25 15:08:09.563	\N
qns9n7mgegbcf0o8xpgoqokn	xxevpbrra70t4616xwtbj2di	12167 VINO OPPIDUM MOSC. S.ANDREA BO NUS LAZIO KM 0 75*6 0,75 CRT 6 52,02		L	\N	2025-11-25 15:08:10.203	2025-11-25 15:08:10.203	\N
ln6q3t853mb22v5pq5aazmld	xxevpbrra70t4616xwtbj2di	12575 VINO ORCHIDEA  MALVASIA  "TEN.LE QUINTE" 75X6 0,75 CRT 6 91,38		L	\N	2025-11-25 15:08:10.839	2025-11-25 15:08:10.839	\N
i4ti9sebh3h8lkceowzzf09r	xxevpbrra70t4616xwtbj2di	12506 VINO ORGIOLO LACRIMA MORRO D'A LBA SUP.DOC M.CAMPI 75*1 0,75 BOT 1 10,88		L	\N	2025-11-25 15:08:11.484	2025-11-25 15:08:11.484	\N
rob279t3fh2xtihbsdk2mn6j	bp7ouzcaq0ogdeue2xz89l1g	0830 MOP COTONE 270GR 1 PZ		PIECE	\N	2025-11-25 15:11:14.67	2025-11-25 15:11:14.67	\N
kd85e2srsx2mpjic66gm35we	xxevpbrra70t4616xwtbj2di	13015 VINO ORVIETO CLASS,SUP.CALCAIA  MUFFA NOBILE BIO VEG.CL 75 0,75 BOT 1 35,28		L	\N	2025-11-25 15:08:12.12	2025-11-25 15:08:12.12	\N
nsevqgh9r64sdlxjyzlt1awn	xxevpbrra70t4616xwtbj2di	12532 VINO ORVIETO CLASS,SUP.CASTAGN OLO CL 75*6 VEG. 0,75 CRT 6 59,50		L	\N	2025-11-25 15:08:12.802	2025-11-25 15:08:12.802	\N
vl9dhk7akhsszlo0eu389874	xxevpbrra70t4616xwtbj2di	13014 VINO ORVIETO CLASS,SUP.LUIGI E  GIOVANNA CL 75 BIO VEG. 0,75 BOT 1 24,65		L	\N	2025-11-25 15:08:13.442	2025-11-25 15:08:13.442	\N
j9tggsurrt4ojl1z9cvh3d1f	xxevpbrra70t4616xwtbj2di	12680 VINO P. BIANCO SCHULTHAUSER 75 *1 S. MICHELE APPIANO 0,75 BOT 1 16,15		L	\N	2025-11-25 15:08:14.079	2025-11-25 15:08:14.079	\N
f7jpnhj8169c36ckn9pimfrt	xxevpbrra70t4616xwtbj2di	13019 VINO P.GRIGIO TERRE DI RAI CL 75*6 0,75 CRT 6 24,48		L	\N	2025-11-25 15:08:14.712	2025-11-25 15:08:14.712	\N
n49h1g1klaeesefsns2x0aj7	xxevpbrra70t4616xwtbj2di	12844 VINO P.MARCHAND POUILLY FUME   LES LOGES CL 75*1 0,75 BOT 1 21,25		L	\N	2025-11-25 15:08:15.352	2025-11-25 15:08:15.352	\N
rww5v63ni67a4dcpxxhk441t	xxevpbrra70t4616xwtbj2di	12197 VINO P.NERO DOC CANT.BOLZ.CL75 X6 0,75 CRT 6 65,03		L	\N	2025-11-25 15:08:15.99	2025-11-25 15:08:15.99	\N
f7owdzvos2nijgw2oy592qxq	xxevpbrra70t4616xwtbj2di	12995 VINO P.NERO FRANZ HAAS CL75*1 0,75 BOT 1 27,20		L	\N	2025-11-25 15:08:16.623	2025-11-25 15:08:16.623	\N
vkxtto7tndg5edn01osrvlpz	xxevpbrra70t4616xwtbj2di	12202 VINO PASSERINA AL DI LA'  "PET RINI" CL 75*6 0,75 CRT 6 51,43		L	\N	2025-11-25 15:08:17.261	2025-11-25 15:08:17.261	\N
uxajzm5vl7rpmr3gfrxfqkpq	xxevpbrra70t4616xwtbj2di	12424 VINO PASSERINA VIGNAQ."COLLEFR ISIO" CL 75*6 0,75 CRT 6 35,36		L	\N	2025-11-25 15:08:17.899	2025-11-25 15:08:17.899	\N
miwiprx9p18godnjajumm5q1	xxevpbrra70t4616xwtbj2di	12166 VINO PECORINO "PECO"  TOLLO CL 75*6 0,75 CRT 6 52,45		L	\N	2025-11-25 15:08:18.536	2025-11-25 15:08:18.536	\N
iie8cxjetgfo628gom9jgkvb	xxevpbrra70t4616xwtbj2di	12551 VINO PECORINO BIO "AURAMADRE"  CL.75*6 0,75 CRT 6 28,05		L	\N	2025-11-25 15:08:19.172	2025-11-25 15:08:19.172	\N
qabn7tjd6foaya9rdua1qi1p	xxevpbrra70t4616xwtbj2di	12451 VINO PECORINO COLLEMORO CL 75 X 6 0,75 CRT 6 23,29		L	\N	2025-11-25 15:08:19.813	2025-11-25 15:08:19.813	\N
kntx3lpv6fu7b0f33o1zd8k4	xxevpbrra70t4616xwtbj2di	12997 VINO PECORINO PORTAMI AL MARE "PETRINI" CL 75*6 0,75 CRT 6 51,43		L	\N	2025-11-25 15:08:20.446	2025-11-25 15:08:20.446	\N
u7s7efhzwb08m3q1wresr3ih	xxevpbrra70t4616xwtbj2di	12425 VINO PECORINO VIGNAQUADRA "COL LEFRISIO" CL75*6 0,75 CRT 6 35,36		L	\N	2025-11-25 15:08:21.096	2025-11-25 15:08:21.096	\N
cqqbgdd9dlwcre0ylv8nh25m	xxevpbrra70t4616xwtbj2di	12074 VINO PETIT MANSENG CAS.DEL GIGLIO CL.75*6 0,75 CRT 6 62,48		L	\N	2025-11-25 15:08:21.733	2025-11-25 15:08:21.733	\N
w7xe42i1xr4zjczgsuy7dll2	xxevpbrra70t4616xwtbj2di	12234 VINO PETIT VERDOT CAS. DEL GIGLIO CL75*6 0,75 CRT 6 65,62		L	\N	2025-11-25 15:08:22.371	2025-11-25 15:08:22.371	\N
kineran8dg4cg17xcth0ndf6	xxevpbrra70t4616xwtbj2di	12824 VINO PETIT VERDOT PALLAVICIN  I 75*6 0,75 CRT 6 55,08		L	\N	2025-11-25 15:08:23.003	2025-11-25 15:08:23.003	\N
mo6zn93dp9bgawuzm937n38t	xxevpbrra70t4616xwtbj2di	12802 VINO PIASTRAIA BOLGHERI SUP.  "SATTA" CL75X1 0,75 BOT 1 44,20		L	\N	2025-11-25 15:08:23.706	2025-11-25 15:08:23.706	\N
y0ukkbg6lvw19p87jgghx2w2	xxevpbrra70t4616xwtbj2di	12872 VINO PIN.BIANCO PLOTZNER S.PAU  LS 75*1 0,75 BOT 1 11,05		L	\N	2025-11-25 15:08:24.342	2025-11-25 15:08:24.342	\N
k2o3q7vw9zg977sigvp7swab	xxevpbrra70t4616xwtbj2di	12223 VINO PINOT BIANCO CANT.BOLZ.CL.75*6 0,75 CRT 6 51,60		L	\N	2025-11-25 15:08:24.972	2025-11-25 15:08:24.972	\N
e4vzugh0sytdz5t9r1d9ad5g	xxevpbrra70t4616xwtbj2di	12768 VINO PINOT BIANCO "JERMANN"  CL75X1 0,75 BOT 1 19,55		L	\N	2025-11-25 15:08:25.615	2025-11-25 15:08:25.615	\N
k2oiijoo767vp9r3gemfolg4	xxevpbrra70t4616xwtbj2di	12940 VINO PINOT BIANCO COLTERENZIO CL 75*6 0,75 CRT 6 58,14		L	\N	2025-11-25 15:08:26.248	2025-11-25 15:08:26.248	\N
ng20scklgwuzmy62f6m9biz7	xxevpbrra70t4616xwtbj2di	12540 VINO PINOT GRIGIO  "ZORZETTIG" CL. 75X6 0,75 CRT 6 46,33		L	\N	2025-11-25 15:08:26.893	2025-11-25 15:08:26.893	\N
xt2qwviwz2tdbgaoehvfry68	xxevpbrra70t4616xwtbj2di	12884 VINO PINOT GRIGIO BACCICHETTO  CL.75*6 0,75 CRT 6 30,26		L	\N	2025-11-25 15:08:27.526	2025-11-25 15:08:27.526	\N
u9lonuti9y72r4u6svhnjr22	xxevpbrra70t4616xwtbj2di	12225 VINO PINOT GRIGIO CANT. BOLZANO CL. 75*6 0,75 CRT 6 55,42		L	\N	2025-11-25 15:08:28.161	2025-11-25 15:08:28.161	\N
ikc9ocvsj17nqv0i8ezfsk1j	xxevpbrra70t4616xwtbj2di	12354 VINO PINOT GRIGIO COLLEMORO CL 75*6 0,75 CRT 6 19,55		L	\N	2025-11-25 15:08:28.797	2025-11-25 15:08:28.797	\N
ooxv1n24dh81fywk9hrlteex	xxevpbrra70t4616xwtbj2di	12126 VINO PINOT GRIGIO COLLIO DOC"S COLARIS" 75X6 0,75 CRT 6 46,92		L	\N	2025-11-25 15:08:29.438	2025-11-25 15:08:29.438	\N
pq1vyqmi61d3mxsrolt4tv2h	xxevpbrra70t4616xwtbj2di	12321 VINO PINOT GRIGIO FERN. CAPPELLO CL 75*6 0,75 CRT 6 24,48		L	\N	2025-11-25 15:08:30.078	2025-11-25 15:08:30.078	\N
jvwnbpnopxah6qkkqk1b8709	xxevpbrra70t4616xwtbj2di	12808 VINO PINOT GRIGIO RAMATO VILLA  VASI CL 75*6 0,75 CRT 6 54,40		L	\N	2025-11-25 15:08:30.74	2025-11-25 15:08:30.74	\N
ysf6qyhl2bqvk9q3xgpcdjy8	xxevpbrra70t4616xwtbj2di	12647 VINO PINOT GRIGIO ST.PAULS  75*6 0,75 CRT 6 50,58		L	\N	2025-11-25 15:08:31.377	2025-11-25 15:08:31.377	\N
mmah05icam8erezxkousrk0l	xxevpbrra70t4616xwtbj2di	12479 VINO PINOT GRIGIO"JERMANN" CL 75X1 0,75 BOT 1 19,55		L	\N	2025-11-25 15:08:32.008	2025-11-25 15:08:32.008	\N
htamqx2dgu85idtr2tkqwxzb	xxevpbrra70t4616xwtbj2di	12010 VINO PINOT NERO BACCICHETTO  CL.75*6 0,75 CRT 6 30,26		L	\N	2025-11-25 15:08:32.639	2025-11-25 15:08:32.639	\N
assc9nh2g8bxg84a1jrx10u8	xxevpbrra70t4616xwtbj2di	12876 VINO PINOT NERO LUZIA S.PAULS  75*6 0,75 CRT 6 76,93		L	\N	2025-11-25 15:08:33.273	2025-11-25 15:08:33.273	\N
la3n4rudxbxz6mosbowaddvz	xxevpbrra70t4616xwtbj2di	12165 VINO PORTO SANDEMAN RUBY ROSSO CL.75*1 0,75 BOT 1 14,03		L	\N	2025-11-25 15:08:33.914	2025-11-25 15:08:33.914	\N
rdzbzdbxmjeluyxcl8tb12b6	xxevpbrra70t4616xwtbj2di	12855 VINO PRIMIT.MAND DOP PAPALE CL 75 X 6 0,75 CRT 6 44,37		L	\N	2025-11-25 15:08:34.549	2025-11-25 15:08:34.549	\N
tiorubutzat1w2i5vytecdpg	xxevpbrra70t4616xwtbj2di	12236 VINO PRIMIT.MAND. DOP CELEBRAT ION QUARTA CL75X6 0,75 CRT 6 31,37		L	\N	2025-11-25 15:08:35.183	2025-11-25 15:08:35.183	\N
jo24yrzman8p4apsiavizb8v	xxevpbrra70t4616xwtbj2di	12471 VINO PRIMIT.MAND.ORO EMERA QUA RTA CL75*1 0,75 BOT 1 15,81		L	\N	2025-11-25 15:08:35.873	2025-11-25 15:08:35.873	\N
oohknshddfv8move0l0wwf5m	xxevpbrra70t4616xwtbj2di	12856 VINO PRIMIT.MAND.ORO PAPALE CL 75*1 0,75 BOT 1 13,60		L	\N	2025-11-25 15:08:36.511	2025-11-25 15:08:36.511	\N
kdwdfvypliznd62tmtb0h23v	xxevpbrra70t4616xwtbj2di	12553 VINO PRIMITIVO IGT "AURAMADRE"  CL.75X6 0,75 CRT 6 28,05		L	\N	2025-11-25 15:08:37.146	2025-11-25 15:08:37.146	\N
k1j145gvbeve3p0isooifxqv	xxevpbrra70t4616xwtbj2di	12595 VINO PRIMULA LUCIS   "TEN.LE QUINTE" 75X6 0,75 CRT 6 68,00		L	\N	2025-11-25 15:08:37.799	2025-11-25 15:08:37.799	\N
n31hxjwiqoq5n8smdjnpfvoz	xxevpbrra70t4616xwtbj2di	12486 VINO RASA MARMORATA TEN.QUINTE CL 75 X 6 0,75 CRT 6 55,59		L	\N	2025-11-25 15:08:38.509	2025-11-25 15:08:38.509	\N
g0wwqwttw7w2g385i31kie4z	xxevpbrra70t4616xwtbj2di	12346 VINO RIB. GIALLA RIJALLA"LA TU NELLA" CL 75X6 0,75 CRT 6 81,77		L	\N	2025-11-25 15:08:39.146	2025-11-25 15:08:39.146	\N
n4lynsjbfbgb37vckedjpvsj	xxevpbrra70t4616xwtbj2di	12325 VINO RIBOLLA G. FERN.CAPPELLO CL 75*6 0,75 CRT 6 24,48		L	\N	2025-11-25 15:08:39.776	2025-11-25 15:08:39.776	\N
nh8pbchfnuiq9y20lcqq9z6v	xxevpbrra70t4616xwtbj2di	12813 VINO RIBOLLA G. SEL. "MYO" ZOR  Z. CL. 75X1 0,75 BOT 1 15,73		L	\N	2025-11-25 15:08:40.408	2025-11-25 15:08:40.408	\N
rqo214629mqorlec7avmk6cb	xxevpbrra70t4616xwtbj2di	13018 VINO RIBOLLA GIAL TERRE DI RAI CL 75*6 0,75 CRT 6 24,48		L	\N	2025-11-25 15:08:41.049	2025-11-25 15:08:41.049	\N
ete33zbtn00k0nuh28qlkvxg	xxevpbrra70t4616xwtbj2di	0,700 lt  TEB001		L	\N	2025-11-25 15:11:15.45	2025-11-25 15:11:15.45	\N
sx1o11srem8y5y7ho5si6h6m	xxevpbrra70t4616xwtbj2di	12541 VINO RIBOLLA GIALLA  "ZORZETTIG" CL. 75X6 0,75 CRT 6 46,33		L	\N	2025-11-25 15:08:41.683	2025-11-25 15:08:41.683	\N
r8rfb5ugq2sbq6sworo80cnp	xxevpbrra70t4616xwtbj2di	12887 VINO RIBOLLA GIALLA BACCICHETT  O CL 75*6 0,75 CRT 6 30,26		L	\N	2025-11-25 15:08:42.318	2025-11-25 15:08:42.318	\N
ekccn3gb02bgpgdx3vh73lw5	xxevpbrra70t4616xwtbj2di	12125 VINO RIBOLLA GIALLA COLLIO DOC  "SCOLARIS" 75X6 0,75 CRT 6 46,92		L	\N	2025-11-25 15:08:42.97	2025-11-25 15:08:42.97	\N
m8q9b3lvm2vlbumthy3qniy6	xxevpbrra70t4616xwtbj2di	12481 VINO RIBOLLA GIALLA JERMANN CL 75*1 0,75 BOT 1 20,40		L	\N	2025-11-25 15:08:43.618	2025-11-25 15:08:43.618	\N
mx0n9v5ct110pjcook3y0lcy	xxevpbrra70t4616xwtbj2di	12925 VINO RIBOLLA GIALLA VILLA VASI CL 75*6 0,75 CRT 6 54,40		L	\N	2025-11-25 15:08:44.262	2025-11-25 15:08:44.262	\N
zzgor0z0yawvue29qpib0364	xxevpbrra70t4616xwtbj2di	12365 VINO RIBOLLA SPUMANT.DOC "SCOL ARIS" 75X6 0,75 CRT 6 46,92		L	\N	2025-11-25 15:08:44.902	2025-11-25 15:08:44.902	\N
dami8d4m1brped61c41j37tm	xxevpbrra70t4616xwtbj2di	12899 Vino ribona altabella bio font ezoppa cl 75*1 0,75 BOT 1 15,05		L	\N	2025-11-25 15:08:45.534	2025-11-25 15:08:45.534	\N
y7p1sauvgzaeqk9atji6ulru	xxevpbrra70t4616xwtbj2di	12173 VINO RIES VIGNA PEZZOLO UVE ST RAMATURE CL75X1 0,75 BOT 1 28,90		L	\N	2025-11-25 15:08:46.167	2025-11-25 15:08:46.167	\N
y7yw92zi0bbp71d37m8vq9lj	xxevpbrra70t4616xwtbj2di	12839 VINO RIESLING ALSACE "LOUIS SC  HERBE" 2021 CL 75 0,75 BOT 1 16,58		L	\N	2025-11-25 15:08:46.919	2025-11-25 15:08:46.919	\N
em0r3uccn7a6ufujvxu9ikp6	xxevpbrra70t4616xwtbj2di	12877 VINO RIESLING BERGSPIEL S.PAUL  S CL 75X6 0,75 CRT 6 67,58		L	\N	2025-11-25 15:08:47.556	2025-11-25 15:08:47.556	\N
cq0kcn7qnoohl7qrgm7w01w8	xxevpbrra70t4616xwtbj2di	12762 VINO RIESLING HOCHKOFLER  "CANT. BOLZANO" CL. 75*6 0,75 CRT 6 66,30		L	\N	2025-11-25 15:08:48.192	2025-11-25 15:08:48.192	\N
upg2lvgb6o9l180uz2b893bu	xxevpbrra70t4616xwtbj2di	12806 VINO RIESLING SUP."MARCH.MONTA LTO" CL75X1 0,75 BOT 1 11,90		L	\N	2025-11-25 15:08:48.882	2025-11-25 15:08:48.882	\N
espw0zrep65egu272xeinjwx	xxevpbrra70t4616xwtbj2di	12781 VINO RIPASSO "REGOLO SARTORI"  CL 75*6 0,75 CRT 6 63,16		L	\N	2025-11-25 15:08:49.519	2025-11-25 15:08:49.519	\N
lk5mwj3m67dfi7247r7rw18h	xxevpbrra70t4616xwtbj2di	12272 VINO RIPASSO CAMPOFIORIN MASI CL75X6 0,75 CRT 6 75,91		L	\N	2025-11-25 15:08:50.154	2025-11-25 15:08:50.154	\N
f1hq5y0eryj36sgouvj4l4n2	xxevpbrra70t4616xwtbj2di	12605 VINO ROMA DOC B.CO LA RASENNA CL 75X6 0,75 CRT 6 34,51		L	\N	2025-11-25 15:08:50.789	2025-11-25 15:08:50.789	\N
ccyb0q9i13dr7gvudkitmy2j	xxevpbrra70t4616xwtbj2di	12606 VINO ROMA DOC ROSSO LA RASENNA CL 75X6 0,75 CRT 6 34,51		L	\N	2025-11-25 15:08:51.421	2025-11-25 15:08:51.421	\N
poswisdjise7s7i4c3q6uk6z	xxevpbrra70t4616xwtbj2di	12710 VINO ROSA DEI FRATI CL 75 X 6 "CA DEI FRATI" 0,75 CRT 6 67,32		L	\N	2025-11-25 15:08:52.059	2025-11-25 15:08:52.059	\N
u67ny0l6yrtdt5mkzwbjm8bg	xxevpbrra70t4616xwtbj2di	12530 VINO ROSATO AMORE BIO VEG. CL 75*6 0,75 CRT 6 59,50		L	\N	2025-11-25 15:08:52.694	2025-11-25 15:08:52.694	\N
nn7rhjpqo0ubamomgrrkhz3a	xxevpbrra70t4616xwtbj2di	12423 VINO ROSATO FILARE' COLLEFRISI O CL 75X6 0,75 CRT 6 31,45		L	\N	2025-11-25 15:08:53.328	2025-11-25 15:08:53.328	\N
cy8wkeka1b6zs86bniq7sege	xxevpbrra70t4616xwtbj2di	13012 VINO ROSE' DEI VENTI CL 75 X 6 0,75 CRT 6 32,30		L	\N	2025-11-25 15:08:54.038	2025-11-25 15:08:54.038	\N
kgw7ag5wwqxyrgmbtydmev1f	xxevpbrra70t4616xwtbj2di	12799 VINO ROSE' ILLUNE "LUNA DEL  CASALE" KM 0 CL75*6 0,75 CRT 6 40,29		L	\N	2025-11-25 15:08:54.698	2025-11-25 15:08:54.698	\N
jej409k7zfnbm6n2fls32sy5	xxevpbrra70t4616xwtbj2di	12996 VINO ROSE' P.NERO FRANZ HAAS CL 75*1 0,75 BOT 1 22,95		L	\N	2025-11-25 15:08:55.36	2025-11-25 15:08:55.36	\N
xfympqkpy66u4cigvv47u3cb	xxevpbrra70t4616xwtbj2di	12719 Vino rosso conero piancarda "g arofoli" cl 75x6 0,75 CRT 6 48,45		L	\N	2025-11-25 15:08:56.002	2025-11-25 15:08:56.002	\N
a4d7zmlsxlrdrndno9ffs0vn	xxevpbrra70t4616xwtbj2di	12915 VINO ROSSO LE VOLTE  "ORNELLAIA" CL 75X1 0,75 BOT 1 22,70		L	\N	2025-11-25 15:08:56.659	2025-11-25 15:08:56.659	\N
ua9996uqg2zpzleou6u9e263	xxevpbrra70t4616xwtbj2di	12970 VINO ROSSO MONT. FALORNI CL 75*6 0,75 CRT 6 76,76		L	\N	2025-11-25 15:08:57.298	2025-11-25 15:08:57.298	\N
lnqrmqfoqlh3cdt7gfyq7pzv	xxevpbrra70t4616xwtbj2di	12949 VINO ROSSO MONT. ROCCAMURA CL 75*6 0,75 CRT 6 76,76		L	\N	2025-11-25 15:08:58.02	2025-11-25 15:08:58.02	\N
ead59z5e1ttuxoydknpikr0q	xxevpbrra70t4616xwtbj2di	12816 VINO ROSSO MONT.2022 PIOMBAIA  75*1 0,75 BOT 1 13,60		L	\N	2025-11-25 15:08:58.656	2025-11-25 15:08:58.656	\N
m7fpipugpruyfkb8fxfvlquq	xxevpbrra70t4616xwtbj2di	12002 VINO ROSSO MONTALCINO BANFI CL  75 X 6 0,75 CRT 6 83,73		L	\N	2025-11-25 15:08:59.289	2025-11-25 15:08:59.289	\N
vw66eg631sv4xh5xsk3oj2nw	xxevpbrra70t4616xwtbj2di	12519 VINO ROSSO ORNELLAIA  "ORNELLAIA" CL 75X1 0,75 BOT 1 204,00		L	\N	2025-11-25 15:08:59.924	2025-11-25 15:08:59.924	\N
blczs4yu6q2l2bqvioz984ie	xxevpbrra70t4616xwtbj2di	12728 VINO ROSSO SOLAIA CL 75*1 0,75 BOT 1 306,85		L	\N	2025-11-25 15:09:00.563	2025-11-25 15:09:00.563	\N
mwjpk3anbhuyt24zsb74kz6r	xxevpbrra70t4616xwtbj2di	12805 VINO RUCHE' "GATTO" CL 75 X 1 0,75 BOT 1 13,60		L	\N	2025-11-25 15:09:01.305	2025-11-25 15:09:01.305	\N
vl7c3z71c303hcwi26se8xbb	xxevpbrra70t4616xwtbj2di	12881 VINO S.MADDALENA HUCK HAM BACH   "CANT.BOLZ." CL 75*6 0,75 CRT 6 57,97		L	\N	2025-11-25 15:09:01.946	2025-11-25 15:09:01.946	\N
sjk5f877wixtwgk5r5jlv508	xxevpbrra70t4616xwtbj2di	12810 VINO SAGRANTINO MONTEFALCO  COLLEPIANO "CAPRAI" CL 75X1 0,75 BOT 1 24,23		L	\N	2025-11-25 15:09:02.578	2025-11-25 15:09:02.578	\N
uhfc33qu7axv4ckgr5hwvl23	xxevpbrra70t4616xwtbj2di	12932 VINO SAN GUIDO LE DIFESE CL 75X1 0,75 BOT 1 28,48		L	\N	2025-11-25 15:09:03.221	2025-11-25 15:09:03.221	\N
zby40ybj8rto21n6czhsnn97	xxevpbrra70t4616xwtbj2di	12548 VINO SANGIOVESE  BIO  "AURAMADRE" CL.75X6 0,75 CRT 6 27,63		L	\N	2025-11-25 15:09:03.855	2025-11-25 15:09:03.855	\N
sq9nvjdyukmuly98hw4bmpuu	xxevpbrra70t4616xwtbj2di	12818 VINO SANGIOVESE SUCCO PIOMBAIA  75*6 0,75 CRT 6 52,45		L	\N	2025-11-25 15:09:04.498	2025-11-25 15:09:04.498	\N
gtjfx1n238votf6zbmj14c8o	xxevpbrra70t4616xwtbj2di	12233 VINO SASSICAIA CL 75*1 0,75 BOT 1 493,00		L	\N	2025-11-25 15:09:05.166	2025-11-25 15:09:05.166	\N
j00xfcwcakfuo0nyxdlbg85k	xxevpbrra70t4616xwtbj2di	12181 VINO SATRICO"CAS.DEL GIGLIO" B ONUS LAZIO 75*6 0,75 CRT 6 48,79		L	\N	2025-11-25 15:09:05.803	2025-11-25 15:09:05.803	\N
du7syx05envtiib6q55zs87f	xxevpbrra70t4616xwtbj2di	12905 VINO SAUVIGN.RONCO MELE VENICA CL.75*1 0,75 BOT 1 46,75		L	\N	2025-11-25 15:09:06.475	2025-11-25 15:09:06.475	\N
hnujewckqrb8ys8zl3j3f1bk	xxevpbrra70t4616xwtbj2di	12543 VINO SAUVIGNON "ZORZETTIG"  CL. 75X6 0,75 CRT 6 46,33		L	\N	2025-11-25 15:09:07.112	2025-11-25 15:09:07.112	\N
sm99lasznacftiuuo00faov6	xxevpbrra70t4616xwtbj2di	12893 VINO SAUVIGNON BACCICHETTO  CL 75 X 6 0,75 CRT 6 30,26		L	\N	2025-11-25 15:09:07.753	2025-11-25 15:09:07.753	\N
ttpize5jilp1md2fc4xvm90e	xxevpbrra70t4616xwtbj2di	12099 VINO SAUVIGNON BLANC CLOUDY BA Y CL.75*1 0,75 BOT 1 30,60		L	\N	2025-11-25 15:09:08.384	2025-11-25 15:09:08.384	\N
czuwhjanzoeexxde81pjwksf	xxevpbrra70t4616xwtbj2di	12048 VINO SAUVIGNON CANTINA BOLZANO  CL75*6 0,75 CRT 6 58,65		L	\N	2025-11-25 15:09:09.116	2025-11-25 15:09:09.116	\N
kfo280fcmd1actqm2ciiqmfr	xxevpbrra70t4616xwtbj2di	12244 VINO SAUVIGNON CAS.DEL GIGLIO 75*6 0,75 CRT 6 56,44		L	\N	2025-11-25 15:09:09.75	2025-11-25 15:09:09.75	\N
skvb5imcvv3ozl24a1uejx96	xxevpbrra70t4616xwtbj2di	12323 VINO SAUVIGNON FERN.CAPPELLO CL 75*6 0,75 CRT 6 24,48		L	\N	2025-11-25 15:09:10.385	2025-11-25 15:09:10.385	\N
kmsleva2b3lz4jnitxhxduoc	xxevpbrra70t4616xwtbj2di	12474 VINO SAUVIGNON JERMANN CL.75*1 0,75 BOT 1 20,40		L	\N	2025-11-25 15:09:11.024	2025-11-25 15:09:11.024	\N
ptkpopzo1u72c0sk2j2ie2b2	xxevpbrra70t4616xwtbj2di	12945 VINO SAUVIGNON LAFOA COLTERENZ IO CL 75*1 0,75 BOT 1 25,76		L	\N	2025-11-25 15:09:11.664	2025-11-25 15:09:11.664	\N
ry5qo1py51kexfbfqpokapt7	xxevpbrra70t4616xwtbj2di	12182 VINO SAUVIGNON MOCK BOLZANO CL.75*1 0,75 BOT 1 12,16		L	\N	2025-11-25 15:09:12.306	2025-11-25 15:09:12.306	\N
xmolpd05pcqye0yqcdfj36cd	xxevpbrra70t4616xwtbj2di	12787 VINO SAUVIGNON S.VALENTIN  "ST.MICHELE" 75*1 0,75 BOT 1 31,11		L	\N	2025-11-25 15:09:12.991	2025-11-25 15:09:12.991	\N
p90bp3e4a49nroun0ma150u0	xxevpbrra70t4616xwtbj2di	12812 VINO SAUVIGNON SEL."MYO" ZORZ.  CL. 75X1 0,75 BOT 1 15,73		L	\N	2025-11-25 15:09:13.631	2025-11-25 15:09:13.631	\N
ep4iqyqf7ws9juyflzu1fz18	xxevpbrra70t4616xwtbj2di	12822 VINO SAUVIGNON ST.PAULS CL  75*6 0,75 CRT 6 55,51		L	\N	2025-11-25 15:09:14.27	2025-11-25 15:09:14.27	\N
czdopz184uhvs5tvorxhau9u	xxevpbrra70t4616xwtbj2di	12910 VINO SAUVIGNON TERRE DI RAI CL 75*6 0,75 CRT 6 24,48		L	\N	2025-11-25 15:09:14.908	2025-11-25 15:09:14.908	\N
lzmwxcsk8b1eeslt9bjbt1on	xxevpbrra70t4616xwtbj2di	12923 VINO SAUVIGNON VILLA VASI CL 75*6 0,75 CRT 6 54,40		L	\N	2025-11-25 15:09:15.546	2025-11-25 15:09:15.546	\N
s2dnoi7ge17htyx0j27vermz	xxevpbrra70t4616xwtbj2di	12713 VINO SAUVIGNON VULCAIA "INAMA"  CL75X6 0,75 CRT 6 77,52		L	\N	2025-11-25 15:09:16.184	2025-11-25 15:09:16.184	\N
usg0ryyqkraw2obojea85160	xxevpbrra70t4616xwtbj2di	12727 VINO SCALABRONE ROSE' CL 75X6 0,75 CRT 6 78,63		L	\N	2025-11-25 15:09:16.821	2025-11-25 15:09:16.821	\N
ff700y1romqg2trz85fxh9hw	xxevpbrra70t4616xwtbj2di	12825 VINO SCHIAVA GRIGIA  ST.PAULS   75*6 0,75 CRT 6 47,01		L	\N	2025-11-25 15:09:17.463	2025-11-25 15:09:17.463	\N
i988sklqq2xtvzruvu287dsv	xxevpbrra70t4616xwtbj2di	12998 VINO SCHIETTO TREBBIANO MACERA TO "PETRINI" CL 75*1 0,75 BOT 1 11,56		L	\N	2025-11-25 15:09:18.099	2025-11-25 15:09:18.099	\N
fomd6em2zyztena80teoua58	xxevpbrra70t4616xwtbj2di	12888 VINO SCHIOPPETTINO BACCICHETTO   CL75X6 0,75 CRT 6 30,26		L	\N	2025-11-25 15:09:18.732	2025-11-25 15:09:18.732	\N
br3emwe6j1vwdez94byvnufi	xxevpbrra70t4616xwtbj2di	12129 VINO SCOLARIS CABERN/SAUVIGNON  COLLIO DOC 75X6 0,75 CRT 6 46,92		L	\N	2025-11-25 15:09:19.383	2025-11-25 15:09:19.383	\N
g9nlfj1few540401rrtk64hy	xxevpbrra70t4616xwtbj2di	12128 VINO SCOLARIS CHARDONNAY COLLIO DOC 75X6 0,75 CRT 6 46,92		L	\N	2025-11-25 15:09:20.024	2025-11-25 15:09:20.024	\N
tko01dp5620b0ppbittjloov	xxevpbrra70t4616xwtbj2di	12124 VINO SCOLARIS COLLIO SAUVIGNO N DOC 75X6 0,75 CRT 6 46,92		L	\N	2025-11-25 15:09:20.659	2025-11-25 15:09:20.659	\N
gruemfxom5blfd9rhfouy79r	xxevpbrra70t4616xwtbj2di	12483 VINO SCOLARIS FRIULANO CL 75X6 0,75 CRT 6 46,92		L	\N	2025-11-25 15:09:21.298	2025-11-25 15:09:21.298	\N
e7zfsafo4dlw2qnao6rryk40	xxevpbrra70t4616xwtbj2di	12127 VINO SCOLARIS MERLOT COLLIO DOC 75X6 0,75 CRT 6 46,92		L	\N	2025-11-25 15:09:21.945	2025-11-25 15:09:21.945	\N
e7rbyg7lqh11ltzt268ih2u3	xxevpbrra70t4616xwtbj2di	12123 VINO SCOLARIS SCHIOPPETTINO DOC CL75X6 0,75 CRT 6 46,92		L	\N	2025-11-25 15:09:22.584	2025-11-25 15:09:22.584	\N
cmimxu1spnw6wszkzu1x1eun	xxevpbrra70t4616xwtbj2di	12480 VINO SCOLARIS TRAMINER COLLIO  DOC 75X6 0,75 CRT 6 46,92		L	\N	2025-11-25 15:09:23.22	2025-11-25 15:09:23.22	\N
g29rdz97w4ghgoymr0fptadn	xxevpbrra70t4616xwtbj2di	12418 VINO SEDARA ROSSO DONNAFUGATA  CL 75X6 0,75 CRT 6 59,25		L	\N	2025-11-25 15:09:23.928	2025-11-25 15:09:23.928	\N
mannprc6ozmk4xifvzpncowf	xxevpbrra70t4616xwtbj2di	12930 VINO S'ELEGAS NURAGUS ARGIOLAS  CL 75X6 0,75 CRT 6 49,73		L	\N	2025-11-25 15:09:24.564	2025-11-25 15:09:24.564	\N
au10wfmfi8ohs5vdnk7szzmk	xxevpbrra70t4616xwtbj2di	12901 VINO SEMIS BARR. BIANCO "COLLE FRISIO" CL 75*1 0,75 BOT 1 11,39		L	\N	2025-11-25 15:09:25.198	2025-11-25 15:09:25.198	\N
fnyfvz9xrktjfrthrdf1x2j3	xxevpbrra70t4616xwtbj2di	12170 VINO SHIRAZ "CAS. DEL GIGLIO"B ONUS LAZIO 75*6 0,75 CRT 6 58,06		L	\N	2025-11-25 15:09:25.832	2025-11-25 15:09:25.832	\N
gynu8z2gd5gqod7mqtlgjuiv	xxevpbrra70t4616xwtbj2di	12568 VINO SHIRAZ ARCHINA' CL 75 X 6 0,75 CRT 6 30,60		L	\N	2025-11-25 15:09:26.462	2025-11-25 15:09:26.462	\N
lnynvfotgz5h1qme4huoxf9o	xxevpbrra70t4616xwtbj2di	12850 VINO SHIRAZ CASALE MATTIA 75*6 0,75 CRT 6 45,05		L	\N	2025-11-25 15:09:27.1	2025-11-25 15:09:27.1	\N
lsassh5r02xjy71k8roi5n9u	xxevpbrra70t4616xwtbj2di	12294 VINO SHIRAZ LA RASENNA CL 75X6 0,75 CRT 6 35,36		L	\N	2025-11-25 15:09:27.732	2025-11-25 15:09:27.732	\N
theo7gmlnzbwvt3s5m47f5y3	xxevpbrra70t4616xwtbj2di	12270 VINO SHIRAZ TELLUS 75*6 0,75 CRT 6 60,35		L	\N	2025-11-25 15:09:28.373	2025-11-25 15:09:28.373	\N
v40lj110whvze9td2haku2mf	xxevpbrra70t4616xwtbj2di	12678 VINO SITO MORESCO NEBB.  "GAJA" CL 75 0,75 BOT 1 50,32		L	\N	2025-11-25 15:09:29.005	2025-11-25 15:09:29.005	\N
r9675diwo5xftf0go9hzm8s2	xxevpbrra70t4616xwtbj2di	12712 VINO SOAVE CLASSICO DOC"INAMA"  CL75X6 0,75 CRT 6 65,20		L	\N	2025-11-25 15:09:29.656	2025-11-25 15:09:29.656	\N
z7kzw3wubea0di2m8lljx10u	xxevpbrra70t4616xwtbj2di	12726 VINO SOAVE FOSCARINO "INAMA"  CL75X1 0,75 BOT 1 23,97		L	\N	2025-11-25 15:09:30.288	2025-11-25 15:09:30.288	\N
e0g13uzuzyp19wvwpii8e7bk	xxevpbrra70t4616xwtbj2di	12601 VINO SOLE LA RASENNA CL 75*1 0,75 BOT 1 12,33		L	\N	2025-11-25 15:09:30.927	2025-11-25 15:09:30.927	\N
mw54lzl7tvr4eaih8i23wt33	xxevpbrra70t4616xwtbj2di	12926 VINO SOMNJA MALVASIA VILLA VAS I CL 75*6 0,75 CRT 6 54,40		L	\N	2025-11-25 15:09:31.569	2025-11-25 15:09:31.569	\N
p197zkcbzh2m17kvrdyhd0rn	xxevpbrra70t4616xwtbj2di	12842 VINO SOUPE' CHABLIS 2022  CL 75*1 0,75 BOT 1 29,33		L	\N	2025-11-25 15:09:32.201	2025-11-25 15:09:32.201	\N
l31ygxfaduvk5nt9e3bghqqz	xxevpbrra70t4616xwtbj2di	12843 VINO SOUPE' CHABLIS G.CRU  LES PREUSES CL 75*1 0,75 BOT 1 64,60		L	\N	2025-11-25 15:09:32.836	2025-11-25 15:09:32.836	\N
i2014h2iezgezqhr3dx4xb3a	xxevpbrra70t4616xwtbj2di	12754 VINO SUSUMANIELLO ROSATO CL 75*6 0,75 CRT 6 45,22		L	\N	2025-11-25 15:09:33.471	2025-11-25 15:09:33.471	\N
sbba024j6ev2lraq64s7mrn8	xxevpbrra70t4616xwtbj2di	12854 VINO SUSUMANIELLO ROSSO CL 75*6 0,75 CRT 6 45,22		L	\N	2025-11-25 15:09:34.115	2025-11-25 15:09:34.115	\N
mrb8sq9yq47rmwu5fxxlqm48	xxevpbrra70t4616xwtbj2di	12669 VINO TARTUFO ROSSO DOC  "MARRONE" CL 75*6 0,75 CRT 6 45,99		L	\N	2025-11-25 15:09:34.747	2025-11-25 15:09:34.747	\N
t7ymupwj9lr80oc4n4dsjc43	xxevpbrra70t4616xwtbj2di	12982 VINO TAURASI"HISTORIA ANTIQUA"  CL 75*1 0,75 BOT 1 18,11		L	\N	2025-11-25 15:09:35.385	2025-11-25 15:09:35.385	\N
iu7ngltvlx4ot3p8xguzv3pi	xxevpbrra70t4616xwtbj2di	12716 VINO terre dei tufi "Teruzzi"  CL75X6 0,75 CRT 6 60,86		L	\N	2025-11-25 15:09:36.02	2025-11-25 15:09:36.02	\N
z8esrzqxr66lc8z85pwyhaio	xxevpbrra70t4616xwtbj2di	12331 VINO TIGNANELLO CL75*1 ANTINOR 1 0,75 BOT 1 135,15		L	\N	2025-11-25 15:09:36.657	2025-11-25 15:09:36.657	\N
akgsrb1u2riokusxuxd0vioe	xxevpbrra70t4616xwtbj2di	12803 VINO TIMORASSO DERTHONA  "VIGN,MASSA" 75*1 0,75 BOT 1 20,57		L	\N	2025-11-25 15:09:37.295	2025-11-25 15:09:37.295	\N
cqgdtjg65ydwynn47g8j2stz	xxevpbrra70t4616xwtbj2di	13025 VINO TRAMINER CA DI RAJO CL 75*6 0,75 CRT 6 31,20		L	\N	2025-11-25 15:09:37.937	2025-11-25 15:09:37.937	\N
j5rk3lqc8dfprzwjwiqz3nxy	xxevpbrra70t4616xwtbj2di	12544 Vino traminer zorzettig cl 75 x 6 0,75 CRT 6 46,33		L	\N	2025-11-25 15:09:38.579	2025-11-25 15:09:38.579	\N
ey6mdox802b559a8ic5vhbnx	xxevpbrra70t4616xwtbj2di	12722 VINO TUFALICCIO"CARPINETI"  CL 75X6 0,75 CRT 6 60,35		L	\N	2025-11-25 15:09:39.309	2025-11-25 15:09:39.309	\N
gp9b68g9c4supg9gyqmoqipx	xxevpbrra70t4616xwtbj2di	12684 VINO TURRIGA ARGIOLAS '20 CL 75*1 0,75 BOT 1 91,80		L	\N	2025-11-25 15:09:39.942	2025-11-25 15:09:39.942	\N
qi13kxaaq3zetp4kajxii1ds	xxevpbrra70t4616xwtbj2di	12501 VINO VALPOLICELLA CLAS.BONAC  "MASI" CL75X1 0,75 BOT 1 9,52		L	\N	2025-11-25 15:09:40.581	2025-11-25 15:09:40.581	\N
vws2ww83sf5rvwfa3y3alpln	xxevpbrra70t4616xwtbj2di	12369 VINO VERDICCHIO LUZANO MAROTTI C. CL75X6 0,75 CRT 6 39,70		L	\N	2025-11-25 15:09:41.221	2025-11-25 15:09:41.221	\N
rv14osqztzw118581ixtzpce	xxevpbrra70t4616xwtbj2di	12845 VINO VERDICCHIO MACERATO V.AUT  UNNO "MAROTTI CAMPI" CL75*1 0,75 BOT 1 16,83		L	\N	2025-11-25 15:09:41.855	2025-11-25 15:09:41.855	\N
cykhgx30xuitngd4u6cfivpi	xxevpbrra70t4616xwtbj2di	12000 VINO VERM. LA PETTEGOLA "BANFI " 75*6 0,75 CRT 6 46,33		L	\N	2025-11-25 15:09:42.494	2025-11-25 15:09:42.494	\N
jwqk1bd17p3sfqjo26kn7sqw	xxevpbrra70t4616xwtbj2di	12508 VINO VERM. LE LUCCIOLE VEGANO  CL 75*1 0,75 BOT 1 11,90		L	\N	2025-11-25 15:09:43.128	2025-11-25 15:09:43.128	\N
j3iko44kznwl62nz6e5j3nid	xxevpbrra70t4616xwtbj2di	12963 VINO VERM. NERO V.B. TERENZUOL A 75*6 0,75 CRT 6 73,36		L	\N	2025-11-25 15:09:43.762	2025-11-25 15:09:43.762	\N
oixasbttivk0kk1rpht22xi3	xxevpbrra70t4616xwtbj2di	12928 VINO VERM.COSTAMOLINO ARGIOLAS  CL 75X6 0,75 CRT 6 50,66		L	\N	2025-11-25 15:09:44.403	2025-11-25 15:09:44.403	\N
vq1zn3wvqkzrlz2rsbqabpc9	xxevpbrra70t4616xwtbj2di	12449 VINO VERM.GALL.GREGU SUP.SELEN U DOCG CL75X6 0,75 CRT 6 74,12		L	\N	2025-11-25 15:09:45.08	2025-11-25 15:09:45.08	\N
h4c36zzi902tdy4cb45whb8i	xxevpbrra70t4616xwtbj2di	12448 VINO VERM.GALL.RIAS DOCG"GREGU  "CL 75X6 0,75 CRT 6 50,58		L	\N	2025-11-25 15:09:45.716	2025-11-25 15:09:45.716	\N
o90jj3a25x55hnev2qcnix80	xxevpbrra70t4616xwtbj2di	13010 VINO VERM.GALL.TARRA NOA SA RA JA "CL 75X6 0,75 CRT 6 54,57		L	\N	2025-11-25 15:09:46.351	2025-11-25 15:09:46.351	\N
xobforhcn9vyh1cyq5g3kbzm	xxevpbrra70t4616xwtbj2di	12475 VINO VERM.LINTORI"CAPICHERA" D OC CL.75*1 0,75 BOT 1 16,32		L	\N	2025-11-25 15:09:47.008	2025-11-25 15:09:47.008	\N
xrkodjk9d32xhtfe6spu8zj4	xxevpbrra70t4616xwtbj2di	12402 VINO VERM.SARDEGNA CANTINE ORA  CL75X 6 0,75 CRT 6 28,05		L	\N	2025-11-25 15:09:47.643	2025-11-25 15:09:47.643	\N
clpwrs83ttsqc851nuru3ugd	xxevpbrra70t4616xwtbj2di	12811 VINO VERM.VIG.BAS.TERENZUOLA C OLLI LUNI 75*6 0,75 CRT 6 68,00		L	\N	2025-11-25 15:09:48.281	2025-11-25 15:09:48.281	\N
fcvcauemy1rje1g0o63xo9ws	xxevpbrra70t4616xwtbj2di	12192 VINO VERMENTINO GALLURA"MANCIN I" 75*6 0,75 CRT 6 62,56		L	\N	2025-11-25 15:09:48.919	2025-11-25 15:09:48.919	\N
bw1wwu2i1aqxar8co39zjrb7	xxevpbrra70t4616xwtbj2di	12879 VINO VERMENTINO LA RASENNA CL  75X6 0,75 CRT 6 33,92		L	\N	2025-11-25 15:09:49.554	2025-11-25 15:09:49.554	\N
x5kpjehbw8vqpu6s6emrus3k	xxevpbrra70t4616xwtbj2di	12715 VINO VERNACCIA ISOLA BIANCA  "TERUZZI" CL75X6 0,75 CRT 6 42,67		L	\N	2025-11-25 15:09:50.195	2025-11-25 15:09:50.195	\N
fh9919f5asls1kh4goyfx325	xxevpbrra70t4616xwtbj2di	12476 VINO VINTAGE TUNINA JERMANN CL 75X1 0,75 BOT 1 54,40		L	\N	2025-11-25 15:09:50.836	2025-11-25 15:09:50.836	\N
wbhkrhhbkz6ks9k0peziz9o5	xxevpbrra70t4616xwtbj2di	12313 VINO VIRTU' ROMANE TEN.QUINTE CL 75 X 6 0,75 CRT 6 77,61		L	\N	2025-11-25 15:09:51.47	2025-11-25 15:09:51.47	\N
ac3u24x2arzo2y1xv8sicc0w	xxevpbrra70t4616xwtbj2di	12914 VINO VITE LUCENTE "FRESCOBALDI " CL 75*1 0,75 BOT 1 28,05		L	\N	2025-11-25 15:09:52.106	2025-11-25 15:09:52.106	\N
xw5wn6stzm8m6t5m42mizwr0	xxevpbrra70t4616xwtbj2di	12714 VINO VULCAIA FUME "INAMA"  CL75X1 0,75 BOT 1 38,85		L	\N	2025-11-25 15:09:52.747	2025-11-25 15:09:52.747	\N
kkxoki1gmi4w1xnm1fuagb95	xxevpbrra70t4616xwtbj2di	12477 VINO WERE DREAMS JERMANN CL 75 X1 0,75 BOT 1 50,58		L	\N	2025-11-25 15:09:53.383	2025-11-25 15:09:53.383	\N
az6bjimcwlwqjhiul41p27z6	xxevpbrra70t4616xwtbj2di	12447 Vino zibibbo secco taif fina c l 75x1 0,75 BOT 1 10,54		L	\N	2025-11-25 15:09:54.031	2025-11-25 15:09:54.031	\N
gdi283bnmbit6bfwgf3rpnil	xxevpbrra70t4616xwtbj2di	12512 VIN SANTO "IL SANTO" LT 1,5*1 1,50 BOT 1 13,60		L	\N	2025-11-25 15:09:54.754	2025-11-25 15:09:54.754	\N
jvj2l0lb7hmlr2nu99l7jnyu	xxevpbrra70t4616xwtbj2di	12947 VINO AGLIANICO TENIMENTI AMJNE I LT 1,5 MAGNUM 1,50 BOT 1 27,63		L	\N	2025-11-25 15:09:55.399	2025-11-25 15:09:55.399	\N
wl7nlvmxpw27etlo3hawbzkq	xxevpbrra70t4616xwtbj2di	12903 VINO MONTEF. LT 1,5 COLLEPIANO  MAGNUM 1,50 BOT 1 58,31		L	\N	2025-11-25 15:09:56.042	2025-11-25 15:09:56.042	\N
zgkleypasdg7i2b05jjs96qb	xxevpbrra70t4616xwtbj2di	12694 VINO MONTEFALCO ROSSO LT 1,5  "A.CAPRAI" MAGNUM 1,50 BOT 1 27,20		L	\N	2025-11-25 15:09:56.674	2025-11-25 15:09:56.674	\N
xxq2tq2c9kt188v5ctusr649	xxevpbrra70t4616xwtbj2di	12786 VINO MONTEP. VIGNAQUADRA MAGNU  M AST. LT 1,5*1 1,50 BOT 1 20,66		L	\N	2025-11-25 15:09:57.314	2025-11-25 15:09:57.314	\N
wamybsifg6lvn3607lc9r09n	xxevpbrra70t4616xwtbj2di	12981 VINO SAUVIGNON LA RASENNA LT 1.5*1 1,50 BOT 1 21,25		L	\N	2025-11-25 15:09:57.951	2025-11-25 15:09:57.951	\N
gzftsjprep01lz828gflpjdx	xxevpbrra70t4616xwtbj2di	12590 VINO VERM. LA PETTEGOLA LT 1,5 1,50 BOT 1 18,70		L	\N	2025-11-25 15:09:58.582	2025-11-25 15:09:58.582	\N
xafxhznwgsgxw2fjqimlqojg	xxevpbrra70t4616xwtbj2di	12186 FUSTO VINO CAVIRO B. SECCO LT2 0 20,00 FUS 1 44,20		PIECE	\N	2025-11-25 15:09:59.223	2025-11-25 15:09:59.223	\N
xn42bd2jv02jvmgadtp1soos	xxevpbrra70t4616xwtbj2di	12670 FUSTO VINO CAVIRO PRODUVETTO  B.CO FRIZZ.LT 20 20,00 FUS 1 44,20		PIECE	\N	2025-11-25 15:09:59.856	2025-11-25 15:09:59.856	\N
ukhvpsv2i0ysoqar9ftqbid1	xxevpbrra70t4616xwtbj2di	12188 FUSTO VINO CAVIRO ROSSO SECCO LT20 20,00 FUS 1 44,20		PIECE	\N	2025-11-25 15:10:00.493	2025-11-25 15:10:00.493	\N
kkuy2cgiqquciyfaq0rm6u4q	xxevpbrra70t4616xwtbj2di	12227 FUSTO VINO SANGIOVESE LT 20 20,00 FUS 1 49,73		PIECE	\N	2025-11-25 15:10:01.13	2025-11-25 15:10:01.13	\N
if8ml1uk99631ybpigf7um51	xxevpbrra70t4616xwtbj2di	12503 VINO APPASSIMENTO R. BAG IN BO X 15 LT COLLEFRISIO 15,00 CRT 1 50,15		PIECE	\N	2025-11-25 15:10:01.769	2025-11-25 15:10:01.769	\N
tcog9nngj641bjeer641tct7	xxevpbrra70t4616xwtbj2di	12405 VINO BIANCO BAG IN BOX 20 LT C OLLE MORO 20,00 CRT 1 44,88		PIECE	\N	2025-11-25 15:10:02.431	2025-11-25 15:10:02.431	\N
vtc3jc5eppsoelygw889fwlv	xxevpbrra70t4616xwtbj2di	12349 VINO BIANCO BAG IN BOX 5 LT COLLE MORO 5,00 CRT 1 10,20		PIECE	\N	2025-11-25 15:10:03.068	2025-11-25 15:10:03.068	\N
x47d5b3xfh2e1jkab3etfsgw	xxevpbrra70t4616xwtbj2di	12406 VINO MONT.BAG COLLE MORO 20LT 20,00 CRT 1 44,88		PIECE	\N	2025-11-25 15:10:03.701	2025-11-25 15:10:03.701	\N
g94cq5qdh42ha1fzkchnw99t	xxevpbrra70t4616xwtbj2di	12279 VINO PECORINO BAG IN BOX 15 LT COLLEFRISIO 15,00 CRT 1 50,15		PIECE	\N	2025-11-25 15:10:04.345	2025-11-25 15:10:04.345	\N
jgczwu1g02eomva5ik66pcn2	xxevpbrra70t4616xwtbj2di	12350 VINO ROSSO BAG IN BOX 5 LT COL LE MORO 5,00 CRT 1 10,20		PIECE	\N	2025-11-25 15:10:04.979	2025-11-25 15:10:04.979	\N
zo9132tpc9wc4qqp63pz48uz	xxevpbrra70t4616xwtbj2di	12258 VINO CHAUDELUNE CL 50*1 0,50 BOT 1 43,35		L	\N	2025-11-25 15:10:05.622	2025-11-25 15:10:05.622	\N
s2syv9uqvfxmphitype1vvcm	xxevpbrra70t4616xwtbj2di	12091 VINO LIQUOROSO ZIBIBBO PELLEGR .50*1 0,50 BOT 1 6,72		L	\N	2025-11-25 15:10:06.257	2025-11-25 15:10:06.257	\N
fqbc749p6tbsog1jy8ysxuco	xxevpbrra70t4616xwtbj2di	12832 BRACHETTO TOSO CL 75X6 0,75 CRT 6 32,64		L	\N	2025-11-25 15:10:06.892	2025-11-25 15:10:06.892	\N
tvhupumkbipspp7wue5y5eu2	xxevpbrra70t4616xwtbj2di	12835 CHAMP. BRUT N.1 "LARMANDIER"   CL 75*1 0,75 BOT 1 43,78		L	\N	2025-11-25 15:10:07.527	2025-11-25 15:10:07.527	\N
bxbb4sah32ujxad3jbxereec	xxevpbrra70t4616xwtbj2di	12743 champ. perle' de larmandier "l armandier" cl 75*1 0,75 BOT 1 52,02		L	\N	2025-11-25 15:10:08.158	2025-11-25 15:10:08.158	\N
y59lxt1s00cli8tcka7zh6pl	xxevpbrra70t4616xwtbj2di	12836 CHAMP. ROSE' & BLANC  "LARMANDIER" CL 75*1 0,75 BOT 1 52,02		L	\N	2025-11-25 15:10:08.794	2025-11-25 15:10:08.794	\N
q5crnjuxakv409vgbyz5p2sm	xxevpbrra70t4616xwtbj2di	12698 CHAMP. SPECIAL CLUB MILL.  "LARMANDIER" CL75*1 0,75 BOT 1 84,15		L	\N	2025-11-25 15:10:09.499	2025-11-25 15:10:09.499	\N
vwpxckv3go54v4mplog2fm56	xxevpbrra70t4616xwtbj2di	12838 CHAMP.BARNAUT AUTHENT. ROSE'  BRUT CL 75 0,75 BOT 1 52,11		L	\N	2025-11-25 15:10:10.133	2025-11-25 15:10:10.133	\N
vact2c8ikkd6tfa8x6rfyd8k	xxevpbrra70t4616xwtbj2di	12767 CHAMP.BARNAUT BLANC DE NOIR P.  NERO CL 75 0,75 BOT 1 49,30		L	\N	2025-11-25 15:10:10.764	2025-11-25 15:10:10.764	\N
mbhegnh4408fne3fz5vxaebd	xxevpbrra70t4616xwtbj2di	12837 CHAMP.BARNAUT GRANDE RESERVE  BRUT CL 75 0,75 BOT 1 48,62		L	\N	2025-11-25 15:10:11.415	2025-11-25 15:10:11.415	\N
wg0eclpjeb4ovize6074ki7x	xxevpbrra70t4616xwtbj2di	12834 CHAMP.BRUT EXPR. MESNIL  "GONET SULCOVA" CL 75*1 0,75 BOT 1 52,70		L	\N	2025-11-25 15:10:12.051	2025-11-25 15:10:12.051	\N
pjuus70wuqdqk34tm6n2kpac	xxevpbrra70t4616xwtbj2di	12833 CHAMP.BRUT EXPR.CHARDONNAY  "GONET SULCOVA" CL 75*1 0,75 BOT 1 37,83		L	\N	2025-11-25 15:10:12.684	2025-11-25 15:10:12.684	\N
k2e7o37c1m1uc6aifl3i86qk	xxevpbrra70t4616xwtbj2di	12697 CHAMP.BRUT RIS.EXPRES.INITIALE  "GONET SULCOVA" CL 75*1 0,75 BOT 1 33,15		L	\N	2025-11-25 15:10:13.336	2025-11-25 15:10:13.336	\N
i3qx4hx5ode57f33x40a40c4	xxevpbrra70t4616xwtbj2di	12157 CHAMP.DOM.PERIGNON CL.75*1 CUVEE' 0,75 BOT 1 306,85		L	\N	2025-11-25 15:10:13.976	2025-11-25 15:10:13.976	\N
qayowj0kfblv0atu8mcrui0d	xxevpbrra70t4616xwtbj2di	12993 CHAMP.EXPR.INITIALE MAGNUM GON ET SULCOVA LT 1,5 1,50 BOT 1 70,98		L	\N	2025-11-25 15:10:14.611	2025-11-25 15:10:14.611	\N
un86kul1b47b4ux6e2dze1cc	xxevpbrra70t4616xwtbj2di	12933 champ.g.cru' cramant 2019 "lar mandier" cl 75*1 0,75 BOT 1 62,48		L	\N	2025-11-25 15:10:15.252	2025-11-25 15:10:15.252	\N
aepb6ruaqpdf5znntnzada4d	xxevpbrra70t4616xwtbj2di	12744 CHAMP.G.CRU' ESPRIT CRAMANT  "LARMANDIER"  CL 75*1 0,75 BOT 1 62,48		L	\N	2025-11-25 15:10:15.889	2025-11-25 15:10:15.889	\N
g4ix9ahhg7a0b9mlbj3pp4sh	xxevpbrra70t4616xwtbj2di	12766 CHAMP.ROSE' BRUT  "MARC HEBRART" CL 75*1 0,75 BOT 1 52,45		L	\N	2025-11-25 15:10:16.52	2025-11-25 15:10:16.52	\N
h95f2a9gv48sygq9bgjcmf54	xxevpbrra70t4616xwtbj2di	12374 CHAMP.RUINART BLANC DE BLANC CL 75*1 0,75 BOT 1 110,50		L	\N	2025-11-25 15:10:17.169	2025-11-25 15:10:17.169	\N
a2yys2syncmw1g7w2zzm1f2h	xxevpbrra70t4616xwtbj2di	12220 CHAMP.VEUVE CLIQUOT S.PIETROBURGO 75*1 0,75 BOT 1 59,08		L	\N	2025-11-25 15:10:17.802	2025-11-25 15:10:17.802	\N
ibxnu6knzjsflasmcvpyiqs3	xxevpbrra70t4616xwtbj2di	12656 CHAMPAGNE  BRUT "KRUG" CL 75*1 NUDO 0,75 BOT 1 306,00		L	\N	2025-11-25 15:10:18.437	2025-11-25 15:10:18.437	\N
r09w0ypu81fgv7bo412hoe93	xxevpbrra70t4616xwtbj2di	12578 CHAMPAGNE CHARLES JOUBERT RES.  CL.75*1 0,75 BOT 1 22,10		L	\N	2025-11-25 15:10:19.066	2025-11-25 15:10:19.066	\N
rm89tqkvggrtykgu59plbfao	xxevpbrra70t4616xwtbj2di	12184 CHAMPAGNE CRISTAL BRUT CL75*1 0,75 BOT 1 329,80		L	\N	2025-11-25 15:10:19.703	2025-11-25 15:10:19.703	\N
fc67gxz19qvjv0iql7y62fd8	xxevpbrra70t4616xwtbj2di	12042 CHAMPAGNE CRISTAL ROSE' AST. CL.75 0,75 BOT 1 734,40		L	\N	2025-11-25 15:10:20.339	2025-11-25 15:10:20.339	\N
szug2ms88joru7xg44hobe8a	xxevpbrra70t4616xwtbj2di	12665 CHAMPAGNE MOET GRAND VINTAGE  CL.75*1 0,75 BOT 1 67,32		L	\N	2025-11-25 15:10:20.986	2025-11-25 15:10:20.986	\N
flumnauea3tcqvpmr8ckijai	xxevpbrra70t4616xwtbj2di	12104 CHAMPAGNE MOET ICE IMP. LT 1,5 1,50 BOT 1 187,00		L	\N	2025-11-25 15:10:21.619	2025-11-25 15:10:21.619	\N
ngvca5wdr9zdj4gtrooa5u98	xxevpbrra70t4616xwtbj2di	12967 CHAMPAGNE MOET ICE IMPERIAL CL.75*1 0,75 BOT 1 81,60		L	\N	2025-11-25 15:10:22.262	2025-11-25 15:10:22.262	\N
ve85jzj3ywxt7y4i9lp7y85h	xxevpbrra70t4616xwtbj2di	12973 CHAMPAGNE MOET NIR CL 75*1 0,75 BOT 1 95,20		L	\N	2025-11-25 15:10:22.897	2025-11-25 15:10:22.897	\N
ykj309z6x7mdahbhnt6d95x6	xxevpbrra70t4616xwtbj2di	12156 CHAMPAGNE MOET RIS. IMP.BRUT CL.75*1 0,75 BOT 1 51,51		L	\N	2025-11-25 15:10:23.537	2025-11-25 15:10:23.537	\N
n1shorexuqa7j2zvacyhos1i	xxevpbrra70t4616xwtbj2di	12163 CHAMPAGNE MOET ROSE' ICE CL 75*1 0,75 BOT 1 91,80		L	\N	2025-11-25 15:10:24.176	2025-11-25 15:10:24.176	\N
a4cvfl35k9r7t4d2om36noe1	xxevpbrra70t4616xwtbj2di	12228 CHAMPAGNE MUMM CL75*1 0,75 BOT 1 49,30		L	\N	2025-11-25 15:10:24.878	2025-11-25 15:10:24.878	\N
hexy3pcys3zegfxvo0lckqhw	xxevpbrra70t4616xwtbj2di	12044 CHAMPAGNE MUMM CR JEROBOAM CL.300 3,00 BOT 1 336,60		PIECE	\N	2025-11-25 15:10:25.516	2025-11-25 15:10:25.516	\N
t2iuhgqnw3qpjbvbfsuvvw3v	xxevpbrra70t4616xwtbj2di	12193 PROS. BANDAROSSA MILL."BORTOLO MIOL"75*6 DOCG 0,75 CRT 6 56,95		L	\N	2025-11-25 15:10:26.152	2025-11-25 15:10:26.152	\N
vipfgjpwhpizyjv5m0599n0e	xxevpbrra70t4616xwtbj2di	12024 PROS. BORT. BANDAROSSA 375*12 0,38 CRT 12 73,95		BOX	\N	2025-11-25 15:10:26.79	2025-11-25 15:10:26.79	\N
tduhaca17qmsagh2v5og2mty	xxevpbrra70t4616xwtbj2di	12046 PROS. BORT.VALDOB.SUP. CARTIZZE CL.75*6 0,75 CRT 6 101,15		L	\N	2025-11-25 15:10:27.438	2025-11-25 15:10:27.438	\N
q4jbdedt7z8kajy8y9ysitl8	xxevpbrra70t4616xwtbj2di	12432 PROS. FRATTINA DOC CL 75 X 6 0,75 CRT 6 50,15		L	\N	2025-11-25 15:10:28.11	2025-11-25 15:10:28.11	\N
vqjy4afrgy8o9p1m0ga4zpay	xxevpbrra70t4616xwtbj2di	12215 PROS. PRIOR BRUT DOCG"BORTOLOM IOL"CL75*6 0,75 CRT 6 50,15		L	\N	2025-11-25 15:10:28.786	2025-11-25 15:10:28.786	\N
iaxv7vl8oemcr8qmugu03yua	xxevpbrra70t4616xwtbj2di	12977 PROS. S.MARTINO VALD.DOCG MILL  CL 75X6 0,75 CRT 6 42,16		L	\N	2025-11-25 15:10:29.423	2025-11-25 15:10:29.423	\N
c1y30goz75epludiimg9mjnf	xxevpbrra70t4616xwtbj2di	12204 PROS. SENIOR EX DRY"BORTOLOMIO L"DOCG CL.75*6 0,75 CRT 6 51,00		L	\N	2025-11-25 15:10:30.1	2025-11-25 15:10:30.1	\N
rvxmbtbhe6zeph09nr9yqg50	xxevpbrra70t4616xwtbj2di	12974 PROS. TREVISO DOC MILL. EX DRY  "S.MARTINO" CL 75X6 0,75 CRT 6 34,17		L	\N	2025-11-25 15:10:30.738	2025-11-25 15:10:30.738	\N
d0wui8iccqhv9rkku4nkbxol	xxevpbrra70t4616xwtbj2di	12975 PROS. TREVISO DOC MILL. ROSE'  "S.MARTINO" CL 75X6 0,75 CRT 6 35,02		L	\N	2025-11-25 15:10:31.436	2025-11-25 15:10:31.436	\N
rhxtuqxfk5xblm4vcwwlm6yr	xxevpbrra70t4616xwtbj2di	12209 PROS.MIOL TREVISO DOC "BORTOLO MIOL" 0.75*6 0,75 CRT 6 40,38		L	\N	2025-11-25 15:10:32.071	2025-11-25 15:10:32.071	\N
ocl5fkvh0ndg3m3ud9balytk	xxevpbrra70t4616xwtbj2di	12089 PROS.SUAVIS VALD.SUP."BORTOLOM IOL"75*6 0,75 CRT 6 51,00		L	\N	2025-11-25 15:10:32.705	2025-11-25 15:10:32.705	\N
huunc7ed14zuc4wst947p4g3	xxevpbrra70t4616xwtbj2di	12748 PROS.V8 SIOR PIERO EX DRY  GRIGIO CL75X6 0,75 CRT 6 44,20		L	\N	2025-11-25 15:10:33.359	2025-11-25 15:10:33.359	\N
w1yv9d0de055p7bvbg2sdcai	xxevpbrra70t4616xwtbj2di	12242 PROS.VALD. COL DEL FORNO 75*1 RIVE REFR.ANDREOLA 0,75 BOT 1 9,52		L	\N	2025-11-25 15:10:34.009	2025-11-25 15:10:34.009	\N
ypvtqr1fmpm4zjchcsa2zbwj	xxevpbrra70t4616xwtbj2di	13021 PROS.VALD. COL DEL FORNO AST. LT 1.5 *1 RIVE DI REFR. 1,50 BOT 1 22,44		L	\N	2025-11-25 15:10:34.902	2025-11-25 15:10:34.902	\N
c7iwv8on3xh4n4ffkvha7xrz	xxevpbrra70t4616xwtbj2di	13022 PROS.VALD. COL DEL FORNO LEGNO  3 LT RIVE REFR. 3,00 BOT 1 62,05		PIECE	\N	2025-11-25 15:10:35.54	2025-11-25 15:10:35.54	\N
a9t2szoc8r3gn5xlgq898ruj	xxevpbrra70t4616xwtbj2di	12248 PROS.VALD.BRUT DIRUPO CL 75*6 ANDREOLA 0,75 CRT 6 49,05		L	\N	2025-11-25 15:10:36.174	2025-11-25 15:10:36.174	\N
yyxmrhwqmoqtnqoqxj4fiuaf	xxevpbrra70t4616xwtbj2di	12243 PROS.VALD.EXTRA DRY DIRUPO CL 75*6 ANDREOLA 0,75 CRT 6 49,05		L	\N	2025-11-25 15:10:36.815	2025-11-25 15:10:36.815	\N
lp1mwrjpv1yge8ln7bfe2t8h	xxevpbrra70t4616xwtbj2di	12107 PROSEC.PINOT DI PINOT CL 20X24  GANCIA 0,20 CRT 24 43,10		BOX	\N	2025-11-25 15:10:37.461	2025-11-25 15:10:37.461	\N
l8ynnj8zkrzdb78c4bzg6agg	xxevpbrra70t4616xwtbj2di	12152 PROSECCHINO "MASCHIO"CL.20*24 0,20 CRT 24 48,79		BOX	\N	2025-11-25 15:10:38.099	2025-11-25 15:10:38.099	\N
zjv90zlovciyy1oenjxfvb0r	xxevpbrra70t4616xwtbj2di	12438 PROSECCO NAONIS  DOC CL75X6 0,75 CRT 6 33,15		L	\N	2025-11-25 15:10:38.731	2025-11-25 15:10:38.731	\N
poo7vk0xu55w30e79xixi0k8	xxevpbrra70t4616xwtbj2di	12493 PROSECCO NAONIS VALDOB. "DOCG" CL75X6 0,75 CRT 6 46,33		L	\N	2025-11-25 15:10:39.38	2025-11-25 15:10:39.38	\N
xepncjoaciebvp02s8qw3zjq	xxevpbrra70t4616xwtbj2di	12169 SPUM P.NERO COSTAGROSSA CL75*1 0,75 BOT 1 20,40		L	\N	2025-11-25 15:10:40.113	2025-11-25 15:10:40.113	\N
p3ayod73mz35jwzm3hy0ruwz	xxevpbrra70t4616xwtbj2di	12077 SPUM. BOLLENERE 48 EXTRA BRUT  "ANT.VINAI" CL75X1 0,75 BOT 1 19,89		L	\N	2025-11-25 15:10:40.816	2025-11-25 15:10:40.816	\N
iyeyo6x0c2552iw3i0qubp5m	xxevpbrra70t4616xwtbj2di	12088 SPUM. BOLLENERE 60 NATURE  "ANT.VINAI" CL75X1 0,75 BOT 1 45,90		L	\N	2025-11-25 15:10:41.454	2025-11-25 15:10:41.454	\N
g2zhsiycu4onnovwtirsjdzd	xxevpbrra70t4616xwtbj2di	12058 SPUM. BOLLENERE BRUT A DEMI  "ANT.VINAI" CL75X6 0,75 CRT 6 69,53		L	\N	2025-11-25 15:10:42.095	2025-11-25 15:10:42.095	\N
haq4ahc7mcu2iwnr1f0y8ovm	xxevpbrra70t4616xwtbj2di	0,700 lt  DLD001		L	\N	2025-11-25 15:11:16.093	2025-11-25 15:11:16.093	\N
h3qc2y74sjc22t8dydm9w1uz	xxevpbrra70t4616xwtbj2di	12778 SPUM. CARTIZZE VALD.SUP.DOCG A NDREOLA  75*1 0,75 BOT 1 23,80		L	\N	2025-11-25 15:10:42.737	2025-11-25 15:10:42.737	\N
aiywc203qwf11pxkrzebky9g	xxevpbrra70t4616xwtbj2di	12841 SPUM. CREMANT ALSACE "LOUIS SC  HERBE" CL 75*1 0,75 BOT 1 18,28		L	\N	2025-11-25 15:10:43.37	2025-11-25 15:10:43.37	\N
rg98r5ujnpg0wdqhsbhw11aa	xxevpbrra70t4616xwtbj2di	12504 SPUM. DIECI GRAMMI S.MARTINO B RUT CL 75X6 0,75 CRT 6 22,44		L	\N	2025-11-25 15:10:44.007	2025-11-25 15:10:44.007	\N
ulsf1yve3vagpfgyvlkiv1r7	xxevpbrra70t4616xwtbj2di	13009 SPUM. DOLCE G.DESSERT TOSO CL 75 X 6 0,75 CRT 6 20,40		L	\N	2025-11-25 15:10:44.646	2025-11-25 15:10:44.646	\N
bc6yu1rpzb4sdodkeia1ct1l	xxevpbrra70t4616xwtbj2di	12353 SPUM. FRANC. ROSE' MAGNUM 1,5  "BONFADINI" 1,50 BOT 1 45,05		L	\N	2025-11-25 15:10:45.327	2025-11-25 15:10:45.327	\N
gzouyq4wwzl8nxkt37jbc284	xxevpbrra70t4616xwtbj2di	12782 SPUM. FRANC.CASA COLONNE 2012  CL75X1 0,75 BOT 1 65,88		L	\N	2025-11-25 15:10:45.96	2025-11-25 15:10:45.96	\N
fpkqci103s2c2sz12gj6f2lg	xxevpbrra70t4616xwtbj2di	12610 SPUM. FRANC.NATURE  "BONFADINI" CL 75*6 0,75 CRT 6 119,00		L	\N	2025-11-25 15:10:46.609	2025-11-25 15:10:46.609	\N
r9wwot4b2okjkrm1xucbwazg	xxevpbrra70t4616xwtbj2di	12287 SPUM. FRECCIANERA EX.BRUT FRAN C. LT 1,5 1,50 BOT 1 41,82		L	\N	2025-11-25 15:10:47.239	2025-11-25 15:10:47.239	\N
yul1tfnsrq0n1sfec7jeztg2	xxevpbrra70t4616xwtbj2di	12398 SPUM. FRECCIANERA EXTRA BRUT FRANC.CL75X6 0,75 CRT 6 123,25		L	\N	2025-11-25 15:10:47.877	2025-11-25 15:10:47.877	\N
v2l77afxx73tbdbqfkrb9qwn	xxevpbrra70t4616xwtbj2di	12779 SPUM. FRECCIANERA NATURE FRANC . CL75X6 0,75 CRT 6 161,08		L	\N	2025-11-25 15:10:48.51	2025-11-25 15:10:48.51	\N
lyywmejl7m1n9q8a800rrggr	xxevpbrra70t4616xwtbj2di	12153 SPUM. FRECCIANERA ROSE' FRANC. CL75*6 0,75 CRT 6 134,30		L	\N	2025-11-25 15:10:49.146	2025-11-25 15:10:49.146	\N
jpyklnbl23e4ueadcbfalg2p	xxevpbrra70t4616xwtbj2di	12158 SPUM. FRECCIANERA SATEN FRANC. CL75X6 0,75 CRT 6 133,45		L	\N	2025-11-25 15:10:49.779	2025-11-25 15:10:49.779	\N
pc7e8v8nxuilb3zvltfzkes4	xxevpbrra70t4616xwtbj2di	12860 SPUM. KIUS BRUT CARPINETI  CL 75*1 0,75 BOT 1 15,81		L	\N	2025-11-25 15:10:50.427	2025-11-25 15:10:50.427	\N
pzep4uuy8tlrck9ufuveurqr	xxevpbrra70t4616xwtbj2di	12554 SPUM. KIUS ROSATO CARPINETI  CL 75*1 0,75 BOT 1 23,55		L	\N	2025-11-25 15:10:51.206	2025-11-25 15:10:51.206	\N
sqwtc0cf58yi9hv7iwm3uqi2	xxevpbrra70t4616xwtbj2di	12076 SPUM.BELLAVISTA ALMA GR.CUVEE' CL.75*1 0,75 BOT 1 35,96		L	\N	2025-11-25 15:10:52.007	2025-11-25 15:10:52.007	\N
svbd3h48tuiewnp3pdlsn9rz	xxevpbrra70t4616xwtbj2di	12918 SPUM.BONF.AURORA ROSE' COF.MIL LESIMATO 75 X1 0,75 BOT 1 41,31		L	\N	2025-11-25 15:10:52.763	2025-11-25 15:10:52.763	\N
d34l9l8zvyl32vcl7yqpg3lt	xxevpbrra70t4616xwtbj2di	12919 SPUM.BONF.VICTUS NATURE COF.MI LLESIMATO 75 X1 0,75 BOT 1 41,31		L	\N	2025-11-25 15:10:53.415	2025-11-25 15:10:53.415	\N
luo4hx512a0rk49ethvhyb2r	xxevpbrra70t4616xwtbj2di	12609 SPUM.BONFADINI ROSE' DOCG CL  75 X 6 0,75 CRT 6 107,10		L	\N	2025-11-25 15:10:54.111	2025-11-25 15:10:54.111	\N
prets6n1rpgd382rcwo9ajpr	xxevpbrra70t4616xwtbj2di	12518 SPUM.BRUT BLANC DE BLANC CUVEE  MILL. "TINTORETTO" CL 75*6 0,75 CRT 6 24,65		L	\N	2025-11-25 15:10:54.852	2025-11-25 15:10:54.852	\N
nnabas73pys2nyf9zhn1ithd	xxevpbrra70t4616xwtbj2di	12741 SPUM.BRUT SARA CHARD.  "LUNA CASALE"  CL 75*6 0,75 CRT 6 54,40		L	\N	2025-11-25 15:10:55.607	2025-11-25 15:10:55.607	\N
n2iawhkksspwk3mh31oatou1	xxevpbrra70t4616xwtbj2di	12873 SPUM.BRUT SARA ROSE' "LUNA CAS  ALE"  CL 75*6 0,75 CRT 6 54,40		L	\N	2025-11-25 15:10:56.293	2025-11-25 15:10:56.293	\N
wru7f7f1fdxsfaqsoikvn8qn	xxevpbrra70t4616xwtbj2di	12657 SPUM.CUVEE' EXTRA DRY  "S.MARTINO" CL 75X6 0,75 CRT 6 22,44		L	\N	2025-11-25 15:10:56.937	2025-11-25 15:10:56.937	\N
vbn1pgj78roiawffupgavnke	xxevpbrra70t4616xwtbj2di	12370 SPUM.CUVEE' JADER BRUT "NAONIS " CL 75 X 6 0,75 CRT 6 23,29		L	\N	2025-11-25 15:10:57.571	2025-11-25 15:10:57.571	\N
ndc3kzvyy645mnz63b07cph3	xxevpbrra70t4616xwtbj2di	12034 SPUM.FRANC. PRESTIGE DOCG "CA'  BOSCO" CL 75*1 0,75 BOT 1 31,11		L	\N	2025-11-25 15:10:58.216	2025-11-25 15:10:58.216	\N
a202cr17518drbbnqigrb8fi	xxevpbrra70t4616xwtbj2di	12511 SPUM.FRANC. SATEN CARPEDIEM  DOCG "BONFADINI" CL75X6 0,75 CRT 6 107,10		L	\N	2025-11-25 15:10:58.852	2025-11-25 15:10:58.852	\N
yftxypx07mxw8h9hiq1fatdg	xxevpbrra70t4616xwtbj2di	12988 SPUM.FRANC.BELLAV.VITTORIO MOR ETTI CL75X1 0,75 CRT 1 115,60		L	\N	2025-11-25 15:10:59.505	2025-11-25 15:10:59.505	\N
la7b1tnlc08zsf0ok77o7g3l	xxevpbrra70t4616xwtbj2di	12990 SPUM.FRANC.BONFADINI BRUT 3 LT   NOBILIUM 3,00 BOT 1 123,25		PIECE	\N	2025-11-25 15:11:00.154	2025-11-25 15:11:00.154	\N
pa5cv44dpyu96bb0hvk7af2c	xxevpbrra70t4616xwtbj2di	12087 SPUM.FRANC.CONTADI CAST.BLANC CL75X1 0,75 BOT 1 22,78		L	\N	2025-11-25 15:11:00.79	2025-11-25 15:11:00.79	\N
vd9z243f76kiu8obdi5yy7lh	xxevpbrra70t4616xwtbj2di	12960 SPUM.FRANC.CONTADI CAST.BRUT CL75X6 0,75 CRT 6 105,40		L	\N	2025-11-25 15:11:01.441	2025-11-25 15:11:01.441	\N
px0jxodf8k5e7s07ted81fei	xxevpbrra70t4616xwtbj2di	12959 SPUM.FRANC.CONTADI CAST.ROSE' CL75X6 0,75 CRT 6 122,40		L	\N	2025-11-25 15:11:02.089	2025-11-25 15:11:02.089	\N
rn9ublbzw5h589qxtl8ulxve	xxevpbrra70t4616xwtbj2di	12047 SPUM.FRANC.CONTADI CAST.SATEN CL75X6 0,75 CRT 6 137,70		L	\N	2025-11-25 15:11:02.724	2025-11-25 15:11:02.724	\N
s2fei6az7ns7jlfm1yvvjxux	xxevpbrra70t4616xwtbj2di	12510 SPUM.FRANCIACORTA BRUT DOCG  NOBILIUM "BONFADINI" 75*6 0,75 CRT 6 95,20		L	\N	2025-11-25 15:11:03.364	2025-11-25 15:11:03.364	\N
zs4by4u1yiyd2h0ohhshtsso	xxevpbrra70t4616xwtbj2di	12218 SPUM.G.CINZANO SWEET DOLCE CL. 75*6 0,75 CRT 6 31,45		L	\N	2025-11-25 15:11:04.003	2025-11-25 15:11:04.003	\N
rj0zkb4qndu6s6c0xtshxjlt	xxevpbrra70t4616xwtbj2di	12891 SPUMANTE FERRARI CL 75*1 0,75 BOT 1 27,63		L	\N	2025-11-25 15:11:04.636	2025-11-25 15:11:04.636	\N
qiz6fo489skcbawkmi8ukv52	xxevpbrra70t4616xwtbj2di	12097 SPUMANTE FERRARI PERLE' ROSE' CL 75*1 0,75 BOT 1 53,13		L	\N	2025-11-25 15:11:05.272	2025-11-25 15:11:05.272	\N
n609de558n4j1mg5dlic3egs	xxevpbrra70t4616xwtbj2di	12861 VINO FRASC.CANNELLINO DOCG  "POGGIO LE VOLPI" 50*1 0,50 BOT 1 11,48		L	\N	2025-11-25 15:11:05.982	2025-11-25 15:11:05.982	\N
vozmyb6ietm56hwlvpt0q95h	xxevpbrra70t4616xwtbj2di	12419 VINO MUFFATO DELLA SALA CL50*1 ANTINORI 0,50 BOT 1 34,00		L	\N	2025-11-25 15:11:06.62	2025-11-25 15:11:06.62	\N
tz8ymrvrag5zkmwbtf39zxxk	xxevpbrra70t4616xwtbj2di	12301 VINO PASSITO AFRODISIUM C.GIGL IO CL 50*1 0,75 BOT 0 22,95		L	\N	2025-11-25 15:11:07.292	2025-11-25 15:11:07.292	\N
j96lljhg7rqmw0kw05p0l3ei	xxevpbrra70t4616xwtbj2di	12961 VINO PASSITO BEN RYE' CL 75*1 DONNAFUGATA 0,75 BOT 1 60,35		L	\N	2025-11-25 15:11:07.929	2025-11-25 15:11:07.929	\N
brql7mranm27td4fpmlizy6p	xxevpbrra70t4616xwtbj2di	12943 VINO PASSITO BEN RYE' ML 375*1  DONNAFUGATA 0,38 BOT 1 31,62		L	\N	2025-11-25 15:11:08.563	2025-11-25 15:11:08.563	\N
jiwpscsdoo9opja5u4b5sxk6	xxevpbrra70t4616xwtbj2di	12221 VINO PASSITO PANTELL.PELLEG CL 75*1 0,75 BOT 1 13,60		L	\N	2025-11-25 15:11:09.202	2025-11-25 15:11:09.202	\N
mjmbt16amb7jhzc74se99dt9	bp7ouzcaq0ogdeue2xz89l1g	TOVTONN TOVAGLIA PERSONALIZZATA 90GR USOMANO 60X40 1 PZ		PIECE	\N	2025-11-25 15:11:10.273	2025-11-25 15:11:10.273	\N
yxsv8n9m72cse9xwsg7m96b3	bp7ouzcaq0ogdeue2xz89l1g	TOVPERS TOVAGLIETTA PERSONALIZZATA 30X40 1 PZ		PIECE	\N	2025-11-25 15:11:10.905	2025-11-25 15:11:10.905	\N
rvr7xsamnywmxg4k603cpo8c	bp7ouzcaq0ogdeue2xz89l1g	50PZ A CF1 CF		PIECE	\N	2025-11-25 15:11:11.568	2025-11-25 15:11:11.568	\N
pczhqs6k91rz4oas9nqhzir3	bp7ouzcaq0ogdeue2xz89l1g	750ML A CF1 PZ		L	\N	2025-11-25 15:11:12.206	2025-11-25 15:11:12.206	\N
camrcp8fjqz6ok9pzdqvw2l4	bp7ouzcaq0ogdeue2xz89l1g	300ML1 PZ		L	\N	2025-11-25 15:11:13.404	2025-11-25 15:11:13.404	\N
bcffslfdg3mtucqzpv4lg761	bp7ouzcaq0ogdeue2xz89l1g	10PZ A CF1 CF		PIECE	\N	2025-11-25 15:11:14.035	2025-11-25 15:11:14.035	\N
ad7ke7bpru2we2i41qzzf51l	xxevpbrra70t4616xwtbj2di	1 lt DLL002		L	\N	2025-11-25 15:11:19.916	2025-11-25 15:11:19.916	\N
ovqqlfr4xwiqvft7dyapwfsq	xxevpbrra70t4616xwtbj2di	1 lt DLL001		L	\N	2025-11-25 15:11:20.552	2025-11-25 15:11:20.552	\N
m1z0og2ydzb2652ul90krr6s	xxevpbrra70t4616xwtbj2di	0,700 lt  DLD004		L	\N	2025-11-25 15:11:21.189	2025-11-25 15:11:21.189	\N
takgr4nf1w4g263ybc9h59s6	xxevpbrra70t4616xwtbj2di	0,700 lt  DLD013		L	\N	2025-11-25 15:11:21.823	2025-11-25 15:11:21.823	\N
jup8pqtmrbs5yuw63iayb6we	xxevpbrra70t4616xwtbj2di	0,700 lt  DLD008		L	\N	2025-11-25 15:11:22.455	2025-11-25 15:11:22.455	\N
khm1yqv42d57ee6k7z972x88	xxevpbrra70t4616xwtbj2di	0,700 lt  DLD006		L	\N	2025-11-25 15:11:23.091	2025-11-25 15:11:23.091	\N
p16h4d3i5zzq55qs4jh8su7d	xxevpbrra70t4616xwtbj2di	0,700 lt  DLD003		L	\N	2025-11-25 15:11:23.723	2025-11-25 15:11:23.723	\N
ccd66n6n25y1ejfzdnp3hkd1	xxevpbrra70t4616xwtbj2di	0,700 lt  DLD014		L	\N	2025-11-25 15:11:24.371	2025-11-25 15:11:24.371	\N
p23bx4fk76i3oqqrhepk5svb	xxevpbrra70t4616xwtbj2di	0,700 lt  DLD005		L	\N	2025-11-25 15:11:25.004	2025-11-25 15:11:25.004	\N
\.


--
-- Data for Name: ProductCategory; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ProductCategory" (id, "groupId", name, slug, "createdAt", "updatedAt") FROM stdin;
i3drl6jajs2ilp2nqwn2rlsl	m7vzcakc9srqq9nxu4x69qb7	Seafood	seafood	2025-11-25 14:52:54.927	2025-11-25 14:54:07.022
bp7ouzcaq0ogdeue2xz89l1g	r5sm13yybx2flbxjue3he9v3	Cleaning & Disposables	cleaning-&-disposables	2025-11-25 15:11:10.061	2025-11-25 15:11:14.526
xxevpbrra70t4616xwtbj2di	y9r7aam3d306uwo51tut0m0a	Beverage	beverage	2025-11-25 14:54:07.833	2025-11-25 15:11:24.862
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Session" (id, "sessionToken", "userId", expires) FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."User" (id, email, name, role, "agentCode", "vendorId", "clientId", "createdAt", "updatedAt", "deletedAt", "emailVerified", "driverId") FROM stdin;
ssq97n6n70oeehsnv9yj0ul3	vendor.plustik@hydra.local	Plustik Manager	VENDOR	\N	yhoxsn248ihovbv0i7flt0le	\N	2025-11-25 15:11:25.643	2025-11-25 15:11:25.643	\N	\N	\N
mnpvmb3folrt4hbfi57a6b4w	vendor.generalbeverage@hydra.local	General Beverage Manager	VENDOR	\N	nrvc77uqaawbor31e1bx4c9a	\N	2025-11-25 15:11:25.714	2025-11-25 15:11:25.714	\N	\N	\N
wcvdo9nz5500y7zvppex7809	vendor.cdfish@hydra.local	CD Fish Manager	VENDOR	\N	ymkw92mnbxxlwruo6rr2yyc1	\N	2025-11-25 15:11:25.785	2025-11-25 15:11:25.785	\N	\N	\N
ip59gmgb6ayzxf4biy6bjt9v	driver.giulia@hydra.local	Giulia Bianchi	DRIVER	\N	\N	\N	2025-11-25 15:11:28.846	2025-11-25 15:11:28.846	\N	\N	n0ylz0bgkele6k8bj98w9w73
i8bdyphhgs463u071ncfnrlg	driver.marco@hydra.local	Marco Rossi	DRIVER	\N	\N	\N	2025-11-25 15:11:28.698	2025-12-01 20:20:21.934	\N	2025-12-01 20:20:21.933	mvhj4q6p47zjngtmhr5njle7
jpdvlucov7zixhv9mruaflix	vendor.whitedog@hydra.local	White Dog Manager	VENDOR	\N	v7ke5gm3d70tn157b0vvxlvg	\N	2025-11-25 15:11:25.497	2025-12-06 23:15:56.365	\N	2025-12-06 23:15:56.364	\N
v1cfdxmrbil7kc6qmfbzdwj6	admin@hydra.local	Admin User	ADMIN	\N	\N	\N	2025-11-25 14:52:53.575	2025-12-06 23:16:12.572	\N	2025-12-06 23:16:12.571	\N
p0l66j6cy39cg7qimylxvf1d	client.demo@hydra.local	Demo Restaurant Manager	CLIENT	\N	\N	tluf5puru5n29pz5r3phzb3n	2025-11-25 15:11:26.38	2025-12-07 00:46:11.064	\N	2025-12-07 00:46:11.062	\N
gzp5yxsh247c68cprtg12bs2	andrea@hydra.local	Andrea	AGENT	ANDREA	\N	\N	2025-11-25 14:52:53.75	2025-11-25 14:52:53.75	\N	\N	\N
kl3pg8h8w1wbz8buwi5t960w	manuele@hydra.local	Manuele	AGENT	MANUELE	\N	\N	2025-11-25 14:52:53.99	2025-11-25 14:52:53.99	\N	\N	\N
\.


--
-- Data for Name: Vehicle; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Vehicle" (id, "licensePlate", description, "createdAt", "updatedAt") FROM stdin;
cmieprfkl00008bac3fdlg1d5	HYD-001	Fiat Ducato - Refrigerated Van	2025-11-25 15:11:28.917	2025-11-25 15:11:28.917
cmieprfom00018bacuh2jmwph	HYD-002	Iveco Daily - Standard Cargo	2025-11-25 15:11:29.063	2025-11-25 15:11:29.063
\.


--
-- Data for Name: Vendor; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Vendor" (id, name, region, notes, "createdAt", "updatedAt", "deletedAt", address, "businessHours", "contactEmail", "contactPhone", "defaultOrderNotes") FROM stdin;
ymkw92mnbxxlwruo6rr2yyc1	CD Fish S.r.l.	\N	\N	2025-11-25 14:52:54.22	2025-11-25 14:52:54.22	\N	\N	\N	\N	\N	\N
nrvc77uqaawbor31e1bx4c9a	General Beverage Distributor	\N	\N	2025-11-25 14:54:07.411	2025-11-25 14:54:07.411	\N	\N	\N	\N	\N	\N
yhoxsn248ihovbv0i7flt0le	Plustik Service S.r.l.	\N	\N	2025-11-25 15:11:09.497	2025-11-25 15:11:09.497	\N	\N	\N	\N	\N	\N
v7ke5gm3d70tn157b0vvxlvg	White Dog S.r.l.	\N	\N	2025-11-25 15:11:14.893	2025-11-26 10:48:54.688	\N	8301 Cochrane Cove	\N	brennanlazzara@gmail.com	15126470809	\N
\.


--
-- Data for Name: VendorProduct; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."VendorProduct" (id, "vendorId", "productId", "vendorSku", "basePriceCents", currency, "stockQty", "leadTimeDays", "minOrderQty", "isActive", "createdAt", "updatedAt", "deletedAt") FROM stdin;
dtsg0jm0wb62ia1r016ssvgm	ymkw92mnbxxlwruo6rr2yyc1	ya758e49bjllygdno6zhkl0i	SKU-ya758e49bjllygdno6zhkl0i	1890	EUR	100	0	\N	t	2025-11-25 14:53:05.798	2025-11-25 14:53:05.798	\N
ejt8tg2upzlq1btiknl4uigo	ymkw92mnbxxlwruo6rr2yyc1	n9dwoxlu9zbmiivlsllyjww9	SKU-n9dwoxlu9zbmiivlsllyjww9	2130	EUR	100	0	\N	t	2025-11-25 14:53:06.441	2025-11-25 14:53:06.441	\N
rnigbmvakcdgtuar30u4wkc9	ymkw92mnbxxlwruo6rr2yyc1	kuho36elphowa0v28kxdi3fe	SKU-kuho36elphowa0v28kxdi3fe	2100	EUR	100	0	\N	t	2025-11-25 14:53:07.074	2025-11-25 14:53:07.074	\N
myqhdfaym8lg2crafjsy4f20	ymkw92mnbxxlwruo6rr2yyc1	unmlsuzwvf2ztf43jtlshgjq	SKU-unmlsuzwvf2ztf43jtlshgjq	2650	EUR	100	0	\N	t	2025-11-25 14:53:07.713	2025-11-25 14:53:07.713	\N
vpl2dvu7ji1n1t1mowngsb5h	ymkw92mnbxxlwruo6rr2yyc1	ply7slfyynxe9v6z01rbekja	SKU-ply7slfyynxe9v6z01rbekja	2550	EUR	100	0	\N	t	2025-11-25 14:53:08.346	2025-11-25 14:53:08.346	\N
ygg9dp9sgpuj8ynu57b2pjrz	ymkw92mnbxxlwruo6rr2yyc1	q840v00tn14wk4xqzusqu6y7	SKU-q840v00tn14wk4xqzusqu6y7	1700	EUR	100	0	\N	t	2025-11-25 14:53:08.978	2025-11-25 14:53:08.978	\N
f9nehb15fwh7mdmyht1jd8ny	ymkw92mnbxxlwruo6rr2yyc1	xhvk0em9gkcfiwsbbqdj9i91	SKU-xhvk0em9gkcfiwsbbqdj9i91	1790	EUR	100	0	\N	t	2025-11-25 14:53:09.615	2025-11-25 14:53:09.615	\N
ztk8e6reawf4zfyjxhwtu6m4	ymkw92mnbxxlwruo6rr2yyc1	m4hasdxj20lyjywmp21i7w0p	SKU-m4hasdxj20lyjywmp21i7w0p	1100	EUR	100	0	\N	t	2025-11-25 14:53:10.253	2025-11-25 14:53:10.253	\N
xb8iq2nrurf2h7d3mxbsk77k	ymkw92mnbxxlwruo6rr2yyc1	wa6gq2idh0elbe59wb3vf9yk	SKU-wa6gq2idh0elbe59wb3vf9yk	1150	EUR	100	0	\N	t	2025-11-25 14:53:10.89	2025-11-25 14:53:10.89	\N
gajlvdytqk8tq0652mpmmh7p	ymkw92mnbxxlwruo6rr2yyc1	zx9s0fi9e5kpq3ucjsedhtxa	SKU-zx9s0fi9e5kpq3ucjsedhtxa	720	EUR	100	0	\N	t	2025-11-25 14:53:11.52	2025-11-25 14:53:11.52	\N
l07ak52dobf67ziaq1m8g7bx	ymkw92mnbxxlwruo6rr2yyc1	ihnle21wv1xy6ejmfja0jtp0	SKU-ihnle21wv1xy6ejmfja0jtp0	880	EUR	100	0	\N	t	2025-11-25 14:53:12.154	2025-11-25 14:53:12.154	\N
ibvyrghoe7tqbbis6zadfxdh	ymkw92mnbxxlwruo6rr2yyc1	e6ji79tl45m76827zrlgulco	SKU-e6ji79tl45m76827zrlgulco	690	EUR	100	0	\N	t	2025-11-25 14:53:12.788	2025-11-25 14:53:12.788	\N
zrkhm7m2tlp29vn3ak941dns	ymkw92mnbxxlwruo6rr2yyc1	daxsfb394cnb12ikp1cvl5gx	SKU-daxsfb394cnb12ikp1cvl5gx	1180	EUR	100	0	\N	t	2025-11-25 14:53:13.421	2025-11-25 14:53:13.421	\N
mo2mkme453tc8im18d3owigd	ymkw92mnbxxlwruo6rr2yyc1	l3thr0197t31fdhsvazbfn6o	SKU-l3thr0197t31fdhsvazbfn6o	1160	EUR	100	0	\N	t	2025-11-25 14:53:14.057	2025-11-25 14:53:14.057	\N
b1ok2218uon2dk2mg82avv2y	nrvc77uqaawbor31e1bx4c9a	wxs88g02k3yyb1kdr2cvk8c6	SKU-wxs88g02k3yyb1kdr2cvk8c6	907	EUR	100	0	\N	t	2025-11-25 15:06:28.486	2025-11-25 15:06:28.486	\N
jguqjxuanbebfnh0esmlpu2n	ymkw92mnbxxlwruo6rr2yyc1	qmjyu5fbmlku7s29s5e5qerz	SKU-qmjyu5fbmlku7s29s5e5qerz	1750	EUR	100	0	\N	t	2025-11-25 14:53:15.35	2025-11-25 14:53:15.35	\N
wo5ar65v941jluc68uwjor8l	ymkw92mnbxxlwruo6rr2yyc1	zetk5mpgoo2ut0vbkpxjo41y	SKU-zetk5mpgoo2ut0vbkpxjo41y	1450	EUR	100	0	\N	t	2025-11-25 14:53:16.215	2025-11-25 14:53:16.215	\N
n69rjlwqdu6l3881mzex7g68	ymkw92mnbxxlwruo6rr2yyc1	s5mpanemkp7cizwrii3p55th	SKU-s5mpanemkp7cizwrii3p55th	17	EUR	100	0	\N	t	2025-11-25 14:53:16.989	2025-11-25 14:53:16.989	\N
y3ffmwhqf7dgmist7cvc52o6	ymkw92mnbxxlwruo6rr2yyc1	o6zsg6bstx3bo4uxdll6rpi0	SKU-o6zsg6bstx3bo4uxdll6rpi0	650	EUR	100	0	\N	t	2025-11-25 14:53:17.676	2025-11-25 14:53:17.676	\N
bqn9rlc202fj3a4ujcwz33sa	ymkw92mnbxxlwruo6rr2yyc1	t7of5xenrprsbh1rw291fddr	SKU-t7of5xenrprsbh1rw291fddr	1090	EUR	100	0	\N	t	2025-11-25 14:53:18.366	2025-11-25 14:53:18.366	\N
zvf3orn0h4i589v8nsrfu9bp	ymkw92mnbxxlwruo6rr2yyc1	eb8ksvx9hm2378de4e49f7ol	SKU-eb8ksvx9hm2378de4e49f7ol	1560	EUR	100	0	\N	t	2025-11-25 14:53:19.145	2025-11-25 14:53:19.145	\N
wri0gquf2lkbud0cjrs6xvig	ymkw92mnbxxlwruo6rr2yyc1	espzyjzfayt712zpno3pnwts	SKU-espzyjzfayt712zpno3pnwts	620	EUR	100	0	\N	t	2025-11-25 14:53:19.854	2025-11-25 14:53:19.854	\N
cres79we4o48jygkhy354b4g	ymkw92mnbxxlwruo6rr2yyc1	rf46u9rs2ygt43gxbs50ai2a	SKU-rf46u9rs2ygt43gxbs50ai2a	640	EUR	100	0	\N	t	2025-11-25 14:53:20.499	2025-11-25 14:53:20.499	\N
m0e6dvlj77qfhmysmq7s2jpg	ymkw92mnbxxlwruo6rr2yyc1	znr74l1zya3ucp7485jsvhx0	SKU-znr74l1zya3ucp7485jsvhx0	1150	EUR	100	0	\N	t	2025-11-25 14:53:21.268	2025-11-25 14:53:21.268	\N
m61xmvxgc2dqb93fjonkgkd1	ymkw92mnbxxlwruo6rr2yyc1	mj6qgqpx8fhkxabalusgbsm1	SKU-mj6qgqpx8fhkxabalusgbsm1	530	EUR	100	0	\N	t	2025-11-25 14:53:21.933	2025-11-25 14:53:21.933	\N
i5yszg64t7082shq694n7jst	ymkw92mnbxxlwruo6rr2yyc1	l2h2te27679ypvxwvvpn07aw	SKU-l2h2te27679ypvxwvvpn07aw	630	EUR	100	0	\N	t	2025-11-25 14:53:22.603	2025-11-25 14:53:22.603	\N
wdsg0zgtoljw1lc2uswq8ex3	ymkw92mnbxxlwruo6rr2yyc1	ytdqu9xnvh5vvh9gtaocsp3c	SKU-ytdqu9xnvh5vvh9gtaocsp3c	730	EUR	100	0	\N	t	2025-11-25 14:53:23.237	2025-11-25 14:53:23.237	\N
wk31c04m6amw6it3k6e0hubr	ymkw92mnbxxlwruo6rr2yyc1	mjsvi20eou9yx47d71yy3w74	SKU-mjsvi20eou9yx47d71yy3w74	890	EUR	100	0	\N	t	2025-11-25 14:53:23.865	2025-11-25 14:53:23.865	\N
hxom2jaasb69skl5wkh4b61a	ymkw92mnbxxlwruo6rr2yyc1	qkbgnccnh2uqhm3okddd81yq	SKU-qkbgnccnh2uqhm3okddd81yq	1800	EUR	100	0	\N	t	2025-11-25 14:53:24.499	2025-11-25 14:53:24.499	\N
x7w6f8n1pyx7rst2ev86s950	ymkw92mnbxxlwruo6rr2yyc1	n2bbpkr2u9hxoaezdcf61hhs	SKU-n2bbpkr2u9hxoaezdcf61hhs	1400	EUR	100	0	\N	t	2025-11-25 14:53:25.138	2025-11-25 14:53:25.138	\N
mo5398fhhfd4yqdo8c2tufoc	ymkw92mnbxxlwruo6rr2yyc1	rv64r4uma5c10f0eg93fcvh7	SKU-rv64r4uma5c10f0eg93fcvh7	370	EUR	100	0	\N	t	2025-11-25 14:53:26.052	2025-11-25 14:53:26.052	\N
p3lbmw4x42mv32mce07jb6zw	ymkw92mnbxxlwruo6rr2yyc1	hl9s7sdb36mzk996dehbj4b5	SKU-hl9s7sdb36mzk996dehbj4b5	335	EUR	100	0	\N	t	2025-11-25 14:53:26.715	2025-11-25 14:53:26.715	\N
q1m3svl8wf37y0mhf8vah7yj	ymkw92mnbxxlwruo6rr2yyc1	crxm4702f1s92kwlxxhqsjga	SKU-crxm4702f1s92kwlxxhqsjga	370	EUR	100	0	\N	t	2025-11-25 14:53:27.35	2025-11-25 14:53:27.35	\N
ozr0mup6qppv6rivv0z8pebp	ymkw92mnbxxlwruo6rr2yyc1	t4md8rl6um1gawvzaja0jend	SKU-t4md8rl6um1gawvzaja0jend	820	EUR	100	0	\N	t	2025-11-25 14:53:28.004	2025-11-25 14:53:28.004	\N
vd80njg6ouv17742sox4xcew	ymkw92mnbxxlwruo6rr2yyc1	fk7ufraon688uf1lih1mkm2h	SKU-fk7ufraon688uf1lih1mkm2h	730	EUR	100	0	\N	t	2025-11-25 14:53:28.805	2025-11-25 14:53:28.805	\N
mo7tebhdh2cpk14kazluowoo	ymkw92mnbxxlwruo6rr2yyc1	ikoiqhze8dk49dtd5ixriu44	SKU-ikoiqhze8dk49dtd5ixriu44	790	EUR	100	0	\N	t	2025-11-25 14:53:29.448	2025-11-25 14:53:29.448	\N
rs4x9olcn8ettwmcv4uynmya	ymkw92mnbxxlwruo6rr2yyc1	iatqslqldyz74w79qfbv35if	SKU-iatqslqldyz74w79qfbv35if	820	EUR	100	0	\N	t	2025-11-25 14:53:30.081	2025-11-25 14:53:30.081	\N
bifl7eadn319baxf6rlooe0d	ymkw92mnbxxlwruo6rr2yyc1	qtk7o35muk5fsde3kx0hwx3m	SKU-qtk7o35muk5fsde3kx0hwx3m	850	EUR	100	0	\N	t	2025-11-25 14:53:30.711	2025-11-25 14:53:30.711	\N
qzius02t2z1av8uog3bgg39g	ymkw92mnbxxlwruo6rr2yyc1	s8sjf8wr0ul9dw55yshr3cba	SKU-s8sjf8wr0ul9dw55yshr3cba	1100	EUR	100	0	\N	t	2025-11-25 14:53:31.362	2025-11-25 14:53:31.362	\N
dcmoaczuurjg8lw3sez5fvgv	ymkw92mnbxxlwruo6rr2yyc1	jm5jd5fmgekohz53v8aw3ffe	SKU-jm5jd5fmgekohz53v8aw3ffe	750	EUR	100	0	\N	t	2025-11-25 14:53:31.997	2025-11-25 14:53:31.997	\N
wui5dtzjsgyob08g18c321c6	ymkw92mnbxxlwruo6rr2yyc1	lparkkxh1s05gic6ys2gwc01	SKU-lparkkxh1s05gic6ys2gwc01	10	EUR	100	0	\N	t	2025-11-25 14:53:32.625	2025-11-25 14:53:32.625	\N
wpbthqm1bhw8ivlbfiizi5im	ymkw92mnbxxlwruo6rr2yyc1	tjjf8r8k05ji2b0lj77t0huk	SKU-tjjf8r8k05ji2b0lj77t0huk	2350	EUR	100	0	\N	t	2025-11-25 14:53:33.264	2025-11-25 14:53:33.264	\N
sc887zccyfxc6qao2xcqy0an	ymkw92mnbxxlwruo6rr2yyc1	yuvv52ahsk5bcow2ofjj5axh	SKU-yuvv52ahsk5bcow2ofjj5axh	2690	EUR	100	0	\N	t	2025-11-25 14:53:33.898	2025-11-25 14:53:33.898	\N
mlh5qz10umtf0knf22ny4d9d	ymkw92mnbxxlwruo6rr2yyc1	oyoke17ediro77vryjpqyuyn	SKU-oyoke17ediro77vryjpqyuyn	1480	EUR	100	0	\N	t	2025-11-25 14:53:34.529	2025-11-25 14:53:34.529	\N
kxrjmobrxk686lgvyac59ruz	ymkw92mnbxxlwruo6rr2yyc1	arjjbb7u0w6py9dekgv2i08k	SKU-arjjbb7u0w6py9dekgv2i08k	1880	EUR	100	0	\N	t	2025-11-25 14:53:35.163	2025-11-25 14:53:35.163	\N
jlala1nrq62204lmsc5bzbsl	ymkw92mnbxxlwruo6rr2yyc1	z8f381tlzgs5hab5xxf5xe90	SKU-z8f381tlzgs5hab5xxf5xe90	1070	EUR	100	0	\N	t	2025-11-25 14:53:35.793	2025-11-25 14:53:35.793	\N
tzkaruyud6crq2hshcu3max1	ymkw92mnbxxlwruo6rr2yyc1	yeootrgmlm1pzzh8wjrauvtv	SKU-yeootrgmlm1pzzh8wjrauvtv	890	EUR	100	0	\N	t	2025-11-25 14:53:14.691	2025-11-25 14:53:36.421	\N
d8h96i5wr9ejl9ar127lt1tv	ymkw92mnbxxlwruo6rr2yyc1	czmztxp7rd5w4xz0abn4gzc0	SKU-czmztxp7rd5w4xz0abn4gzc0	1250	EUR	100	0	\N	t	2025-11-25 14:53:37.112	2025-11-25 14:53:37.112	\N
mopw87i5kk76yfo1vj9usz2r	ymkw92mnbxxlwruo6rr2yyc1	xvu8j5rooedopz401tj1g3cb	SKU-xvu8j5rooedopz401tj1g3cb	880	EUR	100	0	\N	t	2025-11-25 14:53:37.747	2025-11-25 14:53:37.747	\N
vckuot87vzdd18qouf8tf46l	ymkw92mnbxxlwruo6rr2yyc1	pqtbeamjs4bfmvhot5i6heer	SKU-pqtbeamjs4bfmvhot5i6heer	1800	EUR	100	0	\N	t	2025-11-25 14:53:38.388	2025-11-25 14:53:38.388	\N
z78bq11y6nh4v5cn07snkd5f	ymkw92mnbxxlwruo6rr2yyc1	sv7h81txk51bw59vh02yq121	SKU-sv7h81txk51bw59vh02yq121	6000	EUR	100	0	\N	t	2025-11-25 14:53:39.022	2025-11-25 14:53:39.022	\N
deavmtgj3pmv0nhz1f474g4x	ymkw92mnbxxlwruo6rr2yyc1	uc6s7ibxszagk2a7uw7h82aq	SKU-uc6s7ibxszagk2a7uw7h82aq	5550	EUR	100	0	\N	t	2025-11-25 14:53:39.732	2025-11-25 14:53:39.732	\N
pu4s02reim4omjh81pym3cii	ymkw92mnbxxlwruo6rr2yyc1	rlja3bh1lnbhqxhqi5an95ri	SKU-rlja3bh1lnbhqxhqi5an95ri	690	EUR	100	0	\N	t	2025-11-25 14:53:40.377	2025-11-25 14:53:40.377	\N
a9n3eqop8s8xby74bks9kwu1	ymkw92mnbxxlwruo6rr2yyc1	i1i57rpuxzo9u9up0yufakxl	SKU-i1i57rpuxzo9u9up0yufakxl	1500	EUR	100	0	\N	t	2025-11-25 14:53:41.013	2025-11-25 14:53:41.013	\N
kxdb0ju30vuccr9xw2vbfzh5	ymkw92mnbxxlwruo6rr2yyc1	efeixrmvxgpt2xf55pjuubd7	SKU-efeixrmvxgpt2xf55pjuubd7	1290	EUR	100	0	\N	t	2025-11-25 14:53:41.646	2025-11-25 14:53:41.646	\N
c5pdcex54z9ph2u6usqtyqng	ymkw92mnbxxlwruo6rr2yyc1	xebmo7biv9pvvuzgedko6r02	SKU-xebmo7biv9pvvuzgedko6r02	108	EUR	100	0	\N	t	2025-11-25 14:53:42.283	2025-11-25 14:53:42.283	\N
rptj16ifdw7j9j2iabyo5efr	ymkw92mnbxxlwruo6rr2yyc1	zu128cueqs9uzlrnkqg7iwcg	SKU-zu128cueqs9uzlrnkqg7iwcg	830	EUR	100	0	\N	t	2025-11-25 14:53:43.017	2025-11-25 14:53:43.017	\N
xou4v41eowh32zk2iso7gboh	ymkw92mnbxxlwruo6rr2yyc1	gctjx5db9kbrx056464piz78	SKU-gctjx5db9kbrx056464piz78	1500	EUR	100	0	\N	t	2025-11-25 14:53:43.655	2025-11-25 14:53:43.655	\N
rus7v59zfjq9aaglrln1sp5q	ymkw92mnbxxlwruo6rr2yyc1	qi5emas7v0df86s06hwcvqkr	SKU-qi5emas7v0df86s06hwcvqkr	1550	EUR	100	0	\N	t	2025-11-25 14:53:44.285	2025-11-25 14:53:44.285	\N
mdvr4n762bfhuw5if9th65t4	ymkw92mnbxxlwruo6rr2yyc1	aoxefa6ebd9zjy6z9jfsp2xm	SKU-aoxefa6ebd9zjy6z9jfsp2xm	1500	EUR	100	0	\N	t	2025-11-25 14:53:44.916	2025-11-25 14:53:44.916	\N
b6yrldv38gsxqxz1t001qfjq	ymkw92mnbxxlwruo6rr2yyc1	iqimxucm4wmc1fsjisbzmwjy	SKU-iqimxucm4wmc1fsjisbzmwjy	1270	EUR	100	0	\N	t	2025-11-25 14:53:45.546	2025-11-25 14:53:45.546	\N
mbwgolijxfpj77p4qa4zc5cw	ymkw92mnbxxlwruo6rr2yyc1	t3kyx0mbkn6q362q2gkpruxe	SKU-t3kyx0mbkn6q362q2gkpruxe	750	EUR	100	0	\N	t	2025-11-25 14:53:46.178	2025-11-25 14:53:46.178	\N
ynixvrkmwwjjhmr0ss527bf3	ymkw92mnbxxlwruo6rr2yyc1	t2d5lczyuezcatnd1f51vbks	SKU-t2d5lczyuezcatnd1f51vbks	980	EUR	100	0	\N	t	2025-11-25 14:53:46.81	2025-11-25 14:53:46.81	\N
kl5bcnfd1snktyem8nyrr6vz	ymkw92mnbxxlwruo6rr2yyc1	mv8aoozxeo8djofbjni1t27h	SKU-mv8aoozxeo8djofbjni1t27h	1870	EUR	100	0	\N	t	2025-11-25 14:53:47.44	2025-11-25 14:53:47.44	\N
i6b12z589szgayc55iq5u8lc	ymkw92mnbxxlwruo6rr2yyc1	jm44lvj71itqf8dy9qe18672	SKU-jm44lvj71itqf8dy9qe18672	1870	EUR	100	0	\N	t	2025-11-25 14:53:48.077	2025-11-25 14:53:48.077	\N
ozhtbewgwru04w1bhgfwjyae	ymkw92mnbxxlwruo6rr2yyc1	r3lm9qpzoq425ban3u8pa0y8	SKU-r3lm9qpzoq425ban3u8pa0y8	1870	EUR	100	0	\N	t	2025-11-25 14:53:48.708	2025-11-25 14:53:48.708	\N
r0py3adknrjj8azx4z3weqdj	ymkw92mnbxxlwruo6rr2yyc1	ws6nridhdfxsikjzo5clcacd	SKU-ws6nridhdfxsikjzo5clcacd	13	EUR	100	0	\N	t	2025-11-25 14:53:49.339	2025-11-25 14:53:49.339	\N
lbujh72a7ks4ilce933jfkfw	ymkw92mnbxxlwruo6rr2yyc1	t33wmiyhnlvj4rqxeo4ar5y9	SKU-t33wmiyhnlvj4rqxeo4ar5y9	1270	EUR	100	0	\N	t	2025-11-25 14:53:49.973	2025-11-25 14:53:49.973	\N
rfbu6rth43xgg5axbds4zuge	ymkw92mnbxxlwruo6rr2yyc1	tnbahhbstoum3sw1qi16niih	SKU-tnbahhbstoum3sw1qi16niih	1350	EUR	100	0	\N	t	2025-11-25 14:53:50.61	2025-11-25 14:53:50.61	\N
nnt1d946y2zelrdp0rqn62iu	ymkw92mnbxxlwruo6rr2yyc1	v42iejklm1o9bjt26g68yaf5	SKU-v42iejklm1o9bjt26g68yaf5	1500	EUR	100	0	\N	t	2025-11-25 14:53:51.241	2025-11-25 14:53:51.241	\N
izh83hipyifcmxub9g0wfhp9	ymkw92mnbxxlwruo6rr2yyc1	nw4kp82bb7rolfag09k2ifod	SKU-nw4kp82bb7rolfag09k2ifod	2000	EUR	100	0	\N	t	2025-11-25 14:53:51.946	2025-11-25 14:53:51.946	\N
m8n5rfqcfiaqkmkgv36c661x	ymkw92mnbxxlwruo6rr2yyc1	trolkl5eh27qu1n8kfb6gvfp	SKU-trolkl5eh27qu1n8kfb6gvfp	2250	EUR	100	0	\N	t	2025-11-25 14:53:52.582	2025-11-25 14:53:52.582	\N
cz9dgfcy99r7hje97vt1uf9m	ymkw92mnbxxlwruo6rr2yyc1	wf0cmno4udjlkwefvdq9fe27	SKU-wf0cmno4udjlkwefvdq9fe27	2480	EUR	100	0	\N	t	2025-11-25 14:53:53.214	2025-11-25 14:53:53.214	\N
z7v0dbax33d5hboc7f5cnqbz	ymkw92mnbxxlwruo6rr2yyc1	vqier26cglaz6euvsg26brj7	SKU-vqier26cglaz6euvsg26brj7	1000	EUR	100	0	\N	t	2025-11-25 14:53:53.85	2025-11-25 14:53:53.85	\N
k4r9hmg179iekw8pwoko6o0n	ymkw92mnbxxlwruo6rr2yyc1	u77vb3waixzmzx9zftpsuhs4	SKU-u77vb3waixzmzx9zftpsuhs4	900	EUR	100	0	\N	t	2025-11-25 14:53:54.484	2025-11-25 14:53:54.484	\N
ochk2lvmxhswf4gm3cflenyj	ymkw92mnbxxlwruo6rr2yyc1	vuxmga550zqmgsn61jrb5qn7	SKU-vuxmga550zqmgsn61jrb5qn7	750	EUR	100	0	\N	t	2025-11-25 14:53:55.119	2025-11-25 14:53:55.119	\N
ed495vbxsgo6cu6qag1utcub	ymkw92mnbxxlwruo6rr2yyc1	a0bebb53yngks013qmyqmsdj	SKU-a0bebb53yngks013qmyqmsdj	680	EUR	100	0	\N	t	2025-11-25 14:53:55.753	2025-11-25 14:53:55.753	\N
nns3lzohofuzyoqi179o6q3r	ymkw92mnbxxlwruo6rr2yyc1	tdwc340elq6vilfdeb9tlk2f	SKU-tdwc340elq6vilfdeb9tlk2f	1250	EUR	100	0	\N	t	2025-11-25 14:53:56.391	2025-11-25 14:53:56.391	\N
y10n6t5lv01yuvedws490y6q	ymkw92mnbxxlwruo6rr2yyc1	tvs9nfntyk2go3m654hd43eb	SKU-tvs9nfntyk2go3m654hd43eb	1570	EUR	100	0	\N	t	2025-11-25 14:53:57.027	2025-11-25 14:53:57.027	\N
kaasedej7upjwvkqmpx3gzmn	ymkw92mnbxxlwruo6rr2yyc1	ibjo89jcvsstew8l48tun8je	SKU-ibjo89jcvsstew8l48tun8je	680	EUR	100	0	\N	t	2025-11-25 14:53:57.66	2025-11-25 14:53:57.66	\N
c9xi030gp37ulk6qknlx1m4x	ymkw92mnbxxlwruo6rr2yyc1	f8f21osv04qcdlek3rlu7gdp	SKU-f8f21osv04qcdlek3rlu7gdp	1050	EUR	100	0	\N	t	2025-11-25 14:53:58.289	2025-11-25 14:53:58.289	\N
ih5sg5rgedpx7xfghq7t2zne	ymkw92mnbxxlwruo6rr2yyc1	zrwk9ozpe059ce3wthl6wh2v	SKU-zrwk9ozpe059ce3wthl6wh2v	750	EUR	100	0	\N	t	2025-11-25 14:53:58.921	2025-11-25 14:53:58.921	\N
ii56cgox5a10mp9celiqytp0	ymkw92mnbxxlwruo6rr2yyc1	zyi0niimz0inc7zk5v0g34qh	SKU-zyi0niimz0inc7zk5v0g34qh	750	EUR	100	0	\N	t	2025-11-25 14:53:59.554	2025-11-25 14:53:59.554	\N
s5ed4q5qw26tvtrgx7mqc7ag	ymkw92mnbxxlwruo6rr2yyc1	yj8umsfesutn14eat572zxub	SKU-yj8umsfesutn14eat572zxub	740	EUR	100	0	\N	t	2025-11-25 14:54:00.184	2025-11-25 14:54:00.184	\N
l1c9nn1446rj3aqzpgxp345u	ymkw92mnbxxlwruo6rr2yyc1	pni5bxr15wotmnmio6l61tbj	SKU-pni5bxr15wotmnmio6l61tbj	930	EUR	100	0	\N	t	2025-11-25 14:54:00.824	2025-11-25 14:54:00.824	\N
bwsgjl7fthyor6y63va1srdq	ymkw92mnbxxlwruo6rr2yyc1	xzhrsilutm6fkdvvs9be4m5h	SKU-xzhrsilutm6fkdvvs9be4m5h	1190	EUR	100	0	\N	t	2025-11-25 14:54:01.458	2025-11-25 14:54:01.458	\N
gl85494m9os2sbxpf4uv5o2i	ymkw92mnbxxlwruo6rr2yyc1	lh417judr1a6guz5ztsrcx1j	SKU-lh417judr1a6guz5ztsrcx1j	5550	EUR	100	0	\N	t	2025-11-25 14:54:02.094	2025-11-25 14:54:02.094	\N
xwjcd4pbbrt5t75g867cr1pi	ymkw92mnbxxlwruo6rr2yyc1	dmr0pa2wrgmo6ankeelw1cww	SKU-dmr0pa2wrgmo6ankeelw1cww	4550	EUR	100	0	\N	t	2025-11-25 14:54:02.726	2025-11-25 14:54:02.726	\N
q8ihpza195et1v227pb2w3xt	ymkw92mnbxxlwruo6rr2yyc1	rux2csau85849thfozipu0tn	SKU-rux2csau85849thfozipu0tn	3400	EUR	100	0	\N	t	2025-11-25 14:54:03.363	2025-11-25 14:54:03.363	\N
qc3stw7ygkt0l6wjqglpw7pn	ymkw92mnbxxlwruo6rr2yyc1	qxha9a6smn3379ltsam2yap0	SKU-qxha9a6smn3379ltsam2yap0	2950	EUR	100	0	\N	t	2025-11-25 14:54:03.995	2025-11-25 14:54:03.995	\N
qvup0c8ageszrobpgflzxayn	ymkw92mnbxxlwruo6rr2yyc1	djn4bnkecg3p8bgmzw5dr1jk	SKU-djn4bnkecg3p8bgmzw5dr1jk	2350	EUR	100	0	\N	t	2025-11-25 14:54:04.624	2025-11-25 14:54:04.624	\N
b572xxhobprsaq1zlk2jro7s	ymkw92mnbxxlwruo6rr2yyc1	z4r19rceq956zjzp1u5wi4lm	SKU-z4r19rceq956zjzp1u5wi4lm	1190	EUR	100	0	\N	t	2025-11-25 14:54:05.264	2025-11-25 14:54:05.264	\N
zqp8mqthtim2c4ozo1vl13fz	nrvc77uqaawbor31e1bx4c9a	x8c8d8f2gdginmhcej6twxan	SKU-x8c8d8f2gdginmhcej6twxan	6460	EUR	100	0	\N	t	2025-11-25 15:06:29.12	2025-11-25 15:06:29.12	\N
m2gtlftwkmtp0mgqrkzxr3m9	nrvc77uqaawbor31e1bx4c9a	yujibltcsia4212hjc37tg3x	SKU-yujibltcsia4212hjc37tg3x	3196	EUR	100	0	\N	t	2025-11-25 15:06:29.753	2025-11-25 15:06:29.753	\N
kh0htvh6cd0y3k6my4loubhi	nrvc77uqaawbor31e1bx4c9a	jsyt4lbfbat1f16aqmm51036	SKU-jsyt4lbfbat1f16aqmm51036	948	EUR	100	0	\N	t	2025-11-25 15:06:30.38	2025-11-25 15:06:30.38	\N
qoq0sfj4dsrpoi01gu4uitua	nrvc77uqaawbor31e1bx4c9a	nn48y0rkbmkfafs3oiku1ohs	SKU-nn48y0rkbmkfafs3oiku1ohs	1250	EUR	100	0	\N	t	2025-11-25 15:06:31.013	2025-11-25 15:06:31.013	\N
gkrhtvydd571bjkuyuq9uu3o	nrvc77uqaawbor31e1bx4c9a	cylf1xru6x78m6j52zvex2fv	SKU-cylf1xru6x78m6j52zvex2fv	1173	EUR	100	0	\N	t	2025-11-25 15:06:31.71	2025-11-25 15:06:31.71	\N
bx102d7ibtj30t9wfs0urtna	nrvc77uqaawbor31e1bx4c9a	yflaltp5vfamfigxdejeyen5	SKU-yflaltp5vfamfigxdejeyen5	827	EUR	100	0	\N	t	2025-11-25 15:06:32.342	2025-11-25 15:06:32.342	\N
cr9ma428yvka2zlxj362a2xo	nrvc77uqaawbor31e1bx4c9a	nz9nii7elx69wx1lmktnu06u	SKU-nz9nii7elx69wx1lmktnu06u	6375	EUR	100	0	\N	t	2025-11-25 15:06:32.981	2025-11-25 15:06:32.981	\N
gjh9xypiw1c6x53ib15wt62t	nrvc77uqaawbor31e1bx4c9a	ncewdng8n90h9re0lkfypyx7	SKU-ncewdng8n90h9re0lkfypyx7	1183	EUR	100	0	\N	t	2025-11-25 15:06:33.61	2025-11-25 15:06:33.61	\N
a2ulv8ra4zarfne8w2g72i5g	nrvc77uqaawbor31e1bx4c9a	m7unbota507nea0qoxr7zaji	SKU-m7unbota507nea0qoxr7zaji	598	EUR	100	0	\N	t	2025-11-25 15:06:34.241	2025-11-25 15:06:34.241	\N
ojkjjranppno1shvhurbp8eq	nrvc77uqaawbor31e1bx4c9a	hcq1lsj9qhj84e93cdmq1w28	SKU-hcq1lsj9qhj84e93cdmq1w28	326	EUR	100	0	\N	t	2025-11-25 15:06:34.873	2025-11-25 15:06:34.873	\N
hxwva30juklzpxz3cc7oo3rj	nrvc77uqaawbor31e1bx4c9a	ae7skdj7yb8b516ofybiizhh	SKU-ae7skdj7yb8b516ofybiizhh	2720	EUR	100	0	\N	t	2025-11-25 15:06:35.511	2025-11-25 15:06:35.511	\N
c872aw16kh3ees2yijmwouh4	nrvc77uqaawbor31e1bx4c9a	hiikxo61klbwun89wa2wpszb	SKU-hiikxo61klbwun89wa2wpszb	723	EUR	100	0	\N	t	2025-11-25 15:06:36.14	2025-11-25 15:06:36.14	\N
hum0rpba5b19u69yyhq9noua	nrvc77uqaawbor31e1bx4c9a	wm8f141yeqlgodv0idyo3zn0	SKU-wm8f141yeqlgodv0idyo3zn0	1068	EUR	100	0	\N	t	2025-11-25 15:06:36.772	2025-11-25 15:06:36.772	\N
w35dlsr1qwcxx23j583nfi4e	nrvc77uqaawbor31e1bx4c9a	anfw4i4u8pif0wdjb2jqmcif	SKU-anfw4i4u8pif0wdjb2jqmcif	371	EUR	100	0	\N	t	2025-11-25 15:06:37.405	2025-11-25 15:06:37.405	\N
dzbofog8pu2u8aru1y3sgot3	nrvc77uqaawbor31e1bx4c9a	ks98rt5k84hbjeoinhen2e4n	SKU-ks98rt5k84hbjeoinhen2e4n	890	EUR	100	0	\N	t	2025-11-25 15:06:38.04	2025-11-25 15:06:38.04	\N
ci72f3i8rbvvwo0zddwzw07l	nrvc77uqaawbor31e1bx4c9a	dgeai1drqbsq4frzcihnpkmi	SKU-dgeai1drqbsq4frzcihnpkmi	6673	EUR	100	0	\N	t	2025-11-25 15:06:38.671	2025-11-25 15:06:38.671	\N
s7hadd0djw56h4fbmxfmgnwr	nrvc77uqaawbor31e1bx4c9a	ydm1quyg28qixjb2cxyl83xv	SKU-ydm1quyg28qixjb2cxyl83xv	425	EUR	100	0	\N	t	2025-11-25 15:06:39.298	2025-11-25 15:06:39.298	\N
f0tsfbhp00wimnxpnuewrmtk	nrvc77uqaawbor31e1bx4c9a	jiuxehjclq7jotmycdt7yy35	SKU-jiuxehjclq7jotmycdt7yy35	1165	EUR	100	0	\N	t	2025-11-25 15:06:39.928	2025-11-25 15:06:39.928	\N
vv1shxoiy2ms332vqz9aisns	nrvc77uqaawbor31e1bx4c9a	g0flo6ovucpr2jfbia4lgvxt	SKU-g0flo6ovucpr2jfbia4lgvxt	843	EUR	100	0	\N	t	2025-11-25 15:06:40.561	2025-11-25 15:06:40.561	\N
s8mlfeacqd622qhsazx1h10n	nrvc77uqaawbor31e1bx4c9a	gzf378h213xkibofkbsre3fd	SKU-gzf378h213xkibofkbsre3fd	772	EUR	100	0	\N	t	2025-11-25 15:06:41.261	2025-11-25 15:06:41.261	\N
yxq1rk3q45yz9j9ukvq20lwr	nrvc77uqaawbor31e1bx4c9a	rkg1i54eycsjef2h98by08ua	SKU-rkg1i54eycsjef2h98by08ua	504	EUR	100	0	\N	t	2025-11-25 15:06:41.89	2025-11-25 15:06:41.89	\N
ho5dbne3uxrcx233ki2rttsb	nrvc77uqaawbor31e1bx4c9a	pd1g5p5z7qglljonn0hwqy8n	SKU-pd1g5p5z7qglljonn0hwqy8n	881	EUR	100	0	\N	t	2025-11-25 15:06:42.527	2025-11-25 15:06:42.527	\N
ru0xag6k2ifsnhqujpgz0bvz	nrvc77uqaawbor31e1bx4c9a	jtge7o1ew00swf6vnrxlfrw9	SKU-jtge7o1ew00swf6vnrxlfrw9	829	EUR	100	0	\N	t	2025-11-25 15:06:43.153	2025-11-25 15:06:43.153	\N
gujrce621pk2q74djd8g96bg	nrvc77uqaawbor31e1bx4c9a	v1gxf3vjm2bkic4rxy0o95pr	SKU-v1gxf3vjm2bkic4rxy0o95pr	969	EUR	100	0	\N	t	2025-11-25 15:06:43.784	2025-11-25 15:06:43.784	\N
vulpfcvl7fnqjmbb7g9xyh62	nrvc77uqaawbor31e1bx4c9a	aevixibfepkuc7efiigd9ucq	SKU-aevixibfepkuc7efiigd9ucq	408	EUR	100	0	\N	t	2025-11-25 15:06:44.421	2025-11-25 15:06:44.421	\N
b5twvut19qrbabk9e4dtd2zn	nrvc77uqaawbor31e1bx4c9a	yto1ua2cy6p347979xca4gh2	SKU-yto1ua2cy6p347979xca4gh2	2040	EUR	100	0	\N	t	2025-11-25 15:06:45.05	2025-11-25 15:06:45.05	\N
y4n4ovxa22gkpfwl5xlv6zv6	nrvc77uqaawbor31e1bx4c9a	mgv6hjjjc6zvt0l3ma5eqby4	SKU-mgv6hjjjc6zvt0l3ma5eqby4	347	EUR	100	0	\N	t	2025-11-25 15:06:45.683	2025-11-25 15:06:45.683	\N
s3xiofy4mn6up5ej745810wl	nrvc77uqaawbor31e1bx4c9a	q276fxx58mvfev8m8u6myj9d	SKU-q276fxx58mvfev8m8u6myj9d	3111	EUR	100	0	\N	t	2025-11-25 15:06:46.329	2025-11-25 15:06:46.329	\N
kvdqhm7s8kbayd1tq4jdajep	nrvc77uqaawbor31e1bx4c9a	j9l83qye76gf3e304g0emx3v	SKU-j9l83qye76gf3e304g0emx3v	408	EUR	100	0	\N	t	2025-11-25 15:06:46.962	2025-11-25 15:06:46.962	\N
d4tnnwkpwjrrzyletvgb700b	nrvc77uqaawbor31e1bx4c9a	d1zliqklxqgf57m9ntd36jmz	SKU-d1zliqklxqgf57m9ntd36jmz	510	EUR	100	0	\N	t	2025-11-25 15:06:47.591	2025-11-25 15:06:47.591	\N
z2z9mh97x4okhdfnmvffzahl	nrvc77uqaawbor31e1bx4c9a	ek62u8os04uq2t5z0niw7ddt	SKU-ek62u8os04uq2t5z0niw7ddt	799	EUR	100	0	\N	t	2025-11-25 15:06:48.228	2025-11-25 15:06:48.228	\N
qj300tr95qavgay4ncwzqlsq	nrvc77uqaawbor31e1bx4c9a	c6fey4uxs22x61s46jqcf7ut	SKU-c6fey4uxs22x61s46jqcf7ut	1360	EUR	100	0	\N	t	2025-11-25 15:06:48.86	2025-11-25 15:06:48.86	\N
rvj8xk913jmtvvy6q0eb5ehb	nrvc77uqaawbor31e1bx4c9a	li5toonxmduopvochpn3zh5b	SKU-li5toonxmduopvochpn3zh5b	659	EUR	100	0	\N	t	2025-11-25 15:06:49.499	2025-11-25 15:06:49.499	\N
o4odui8mjs3y1fdnqeaik7x8	nrvc77uqaawbor31e1bx4c9a	npqlr6u04jekduse5cgd7353	SKU-npqlr6u04jekduse5cgd7353	779	EUR	100	0	\N	t	2025-11-25 15:06:50.129	2025-11-25 15:06:50.129	\N
chm31tcsoh6g47qah54tfu2y	nrvc77uqaawbor31e1bx4c9a	ukzxki1s01cpxq2avk33zn7g	SKU-ukzxki1s01cpxq2avk33zn7g	470	EUR	100	0	\N	t	2025-11-25 15:06:50.762	2025-11-25 15:06:50.762	\N
oeiqi0pby19ku1cvm617w15l	nrvc77uqaawbor31e1bx4c9a	asnkwo2bn6c4qdcojwmo7gbq	SKU-asnkwo2bn6c4qdcojwmo7gbq	715	EUR	100	0	\N	t	2025-11-25 15:06:51.392	2025-11-25 15:06:51.392	\N
sbsne7wdmivi0m6nonpjsob8	nrvc77uqaawbor31e1bx4c9a	z7ql9oct0v6yeavl8xos87wr	SKU-z7ql9oct0v6yeavl8xos87wr	517	EUR	100	0	\N	t	2025-11-25 15:06:52.025	2025-11-25 15:06:52.025	\N
eollbac1u03geupwiil93x7n	nrvc77uqaawbor31e1bx4c9a	rdozg4zv3prs28gbw3q228ou	SKU-rdozg4zv3prs28gbw3q228ou	1495	EUR	100	0	\N	t	2025-11-25 15:06:52.662	2025-11-25 15:06:52.662	\N
mvl24k16nk1ehceslg3t2i4k	nrvc77uqaawbor31e1bx4c9a	mlsf118b4w6kt8qe3jcu6awh	SKU-mlsf118b4w6kt8qe3jcu6awh	482	EUR	100	0	\N	t	2025-11-25 15:06:53.295	2025-11-25 15:06:53.295	\N
a5rkvfd1nm6g3ssj37hw5r7o	nrvc77uqaawbor31e1bx4c9a	ntlno44x89wr3dsg1kvh8czx	SKU-ntlno44x89wr3dsg1kvh8czx	616	EUR	100	0	\N	t	2025-11-25 15:06:53.928	2025-11-25 15:06:53.928	\N
eth7a24gxigljayqwsb9jnd5	nrvc77uqaawbor31e1bx4c9a	wp41oxe7drgq0w9gayecqvzu	SKU-wp41oxe7drgq0w9gayecqvzu	1658	EUR	100	0	\N	t	2025-11-25 15:06:54.566	2025-11-25 15:06:54.566	\N
daq16ipsoibs2qiq7e0hg3x1	nrvc77uqaawbor31e1bx4c9a	z7u6gh68kkuc6b2ttw1ehvsk	SKU-z7u6gh68kkuc6b2ttw1ehvsk	944	EUR	100	0	\N	t	2025-11-25 15:06:55.2	2025-11-25 15:06:55.2	\N
fx268nqd5e7965itk4utxbei	nrvc77uqaawbor31e1bx4c9a	fbmkzrd0h7so1gisjiooej58	SKU-fbmkzrd0h7so1gisjiooej58	1131	EUR	100	0	\N	t	2025-11-25 15:06:55.83	2025-11-25 15:06:55.83	\N
mb7v4zva6dvyqpy4yt0kc2j6	ymkw92mnbxxlwruo6rr2yyc1	hqqgjxlkbx5yj32yirspr7f3	SKU-hqqgjxlkbx5yj32yirspr7f3	790	EUR	100	0	\N	t	2025-11-25 14:54:05.898	2025-11-25 14:54:05.898	\N
a54v6ek5eutx85wadu1a85k8	ymkw92mnbxxlwruo6rr2yyc1	se4tn5mv24k3zz7exhb1g2yr	SKU-se4tn5mv24k3zz7exhb1g2yr	15	EUR	100	0	\N	t	2025-11-25 14:54:06.6	2025-11-25 14:54:06.6	\N
ns2efj945c12uym1mt4tc9qf	ymkw92mnbxxlwruo6rr2yyc1	yq5vb8xjnflyg5zafpsulffg	SKU-yq5vb8xjnflyg5zafpsulffg	5000	EUR	100	0	\N	t	2025-11-25 14:54:07.236	2025-11-25 14:54:07.236	\N
u2p6pjsy9k6i0u3l3klvvw1b	nrvc77uqaawbor31e1bx4c9a	xueu35n4pn1me3roauhe967j	SKU-xueu35n4pn1me3roauhe967j	19	EUR	100	0	\N	t	2025-11-25 14:54:08.047	2025-11-25 14:54:08.047	\N
l46vg5d7t2cf0jhbb2o8u4n1	nrvc77uqaawbor31e1bx4c9a	lns2ogmc6589e9max6f2l46b	SKU-lns2ogmc6589e9max6f2l46b	19	EUR	100	0	\N	t	2025-11-25 14:54:08.678	2025-11-25 14:54:08.678	\N
e9qx538wg910wjby5al34gak	nrvc77uqaawbor31e1bx4c9a	un8g9m1mpdkerczg4ch43qqj	SKU-un8g9m1mpdkerczg4ch43qqj	40	EUR	100	0	\N	t	2025-11-25 14:54:09.692	2025-11-25 14:54:09.692	\N
yjo8fo2w2x3368zzlknc7s1d	nrvc77uqaawbor31e1bx4c9a	xn06mq2yjfqdaqxnueyx8iow	SKU-xn06mq2yjfqdaqxnueyx8iow	27	EUR	100	0	\N	t	2025-11-25 14:54:10.844	2025-11-25 14:54:10.844	\N
q6a74r7z5v16pcqvc2ajqff2	nrvc77uqaawbor31e1bx4c9a	phw04unwn4wjewijbhrrmidh	SKU-phw04unwn4wjewijbhrrmidh	27	EUR	100	0	\N	t	2025-11-25 14:54:11.482	2025-11-25 14:54:11.482	\N
o8wfkax5l17izra757s5k03h	nrvc77uqaawbor31e1bx4c9a	nk7eeml4f5zma9dmx5uw1utx	SKU-nk7eeml4f5zma9dmx5uw1utx	21	EUR	100	0	\N	t	2025-11-25 14:54:12.114	2025-11-25 14:54:12.114	\N
x9cg9jrtaf5i7og1awsjf136	nrvc77uqaawbor31e1bx4c9a	e5ayvh8mrw1jy2i3kq4iaoua	SKU-e5ayvh8mrw1jy2i3kq4iaoua	44	EUR	100	0	\N	t	2025-11-25 14:54:12.741	2025-11-25 14:54:12.741	\N
wdfmphv4hhqbow49vkeadkdo	nrvc77uqaawbor31e1bx4c9a	idf2qdkzz50oqlmjs4fzwtg4	SKU-idf2qdkzz50oqlmjs4fzwtg4	21	EUR	100	0	\N	t	2025-11-25 14:54:13.378	2025-11-25 14:54:13.378	\N
zymulk5qjxfcy87rd2r0am33	nrvc77uqaawbor31e1bx4c9a	yamixxa68e1xfwngq3qwzl1d	SKU-yamixxa68e1xfwngq3qwzl1d	21	EUR	100	0	\N	t	2025-11-25 14:54:14.014	2025-11-25 14:54:14.014	\N
tayvamhlz56o1osf6ms1nds3	nrvc77uqaawbor31e1bx4c9a	uf7ipr0sbzy46vmca3zsdjqy	SKU-uf7ipr0sbzy46vmca3zsdjqy	21	EUR	100	0	\N	t	2025-11-25 14:54:14.655	2025-11-25 14:54:14.655	\N
pylbqleyr61lzr3d1yvf08hk	nrvc77uqaawbor31e1bx4c9a	eujn7k1g3ljt7g3l5epid65v	SKU-eujn7k1g3ljt7g3l5epid65v	21	EUR	100	0	\N	t	2025-11-25 14:54:15.29	2025-11-25 14:54:15.29	\N
hsuljx9je4tmlp92qsl97261	nrvc77uqaawbor31e1bx4c9a	b7pna28829tmj6c6dqxty1xf	SKU-b7pna28829tmj6c6dqxty1xf	46	EUR	100	0	\N	t	2025-11-25 14:54:15.927	2025-11-25 14:54:15.927	\N
l6dv6ei7abfzq01mt9xi7fhx	nrvc77uqaawbor31e1bx4c9a	r7mutq55u30c6xbvfma1pip7	SKU-r7mutq55u30c6xbvfma1pip7	20	EUR	100	0	\N	t	2025-11-25 14:54:16.558	2025-11-25 14:54:16.558	\N
rinjktmdntquvqb14ja0uzkn	nrvc77uqaawbor31e1bx4c9a	sdhxnhpk5rrlmei68bpk3vkw	SKU-sdhxnhpk5rrlmei68bpk3vkw	20	EUR	100	0	\N	t	2025-11-25 14:54:17.189	2025-11-25 14:54:17.189	\N
u5qolpsbr6whci5bkxxrlbx7	nrvc77uqaawbor31e1bx4c9a	yxdxb2uozc28oecgbk891u1i	SKU-yxdxb2uozc28oecgbk891u1i	39	EUR	100	0	\N	t	2025-11-25 14:54:17.825	2025-11-25 14:54:17.825	\N
xih8sxx9xgzec9zax1j9teyw	nrvc77uqaawbor31e1bx4c9a	xkxxcfq9rmz72hz9wg436198	SKU-xkxxcfq9rmz72hz9wg436198	39	EUR	100	0	\N	t	2025-11-25 14:54:18.463	2025-11-25 14:54:18.463	\N
t981y0rvq6ruzdmosq7wg4js	nrvc77uqaawbor31e1bx4c9a	rjmfxxkt2caha4b2zdu2tadf	SKU-rjmfxxkt2caha4b2zdu2tadf	41	EUR	100	0	\N	t	2025-11-25 14:54:19.097	2025-11-25 14:54:19.097	\N
hc28x1wvqmwc6ppq37cmh5kv	nrvc77uqaawbor31e1bx4c9a	txm775b1vowgu0a94yt7g3ly	SKU-txm775b1vowgu0a94yt7g3ly	41	EUR	100	0	\N	t	2025-11-25 14:54:19.734	2025-11-25 14:54:19.734	\N
c3orw9ccohf489yp4fg3kxxh	nrvc77uqaawbor31e1bx4c9a	ooyo8x6di1pj1as2onuxlm15	SKU-ooyo8x6di1pj1as2onuxlm15	41	EUR	100	0	\N	t	2025-11-25 14:54:20.368	2025-11-25 14:54:20.368	\N
z1k3vxcvu74niducjxzy025t	nrvc77uqaawbor31e1bx4c9a	ekp6fpuh9jc8us4ixuptv0vk	SKU-ekp6fpuh9jc8us4ixuptv0vk	41	EUR	100	0	\N	t	2025-11-25 14:54:21.082	2025-11-25 14:54:21.082	\N
r15fe6bylnz1g80i2ohq5u5i	nrvc77uqaawbor31e1bx4c9a	wr8s7hqtfrh48jfj4axcr80r	SKU-wr8s7hqtfrh48jfj4axcr80r	47	EUR	100	0	\N	t	2025-11-25 14:54:21.786	2025-11-25 14:54:21.786	\N
jy63t3vjoc0lfl9m7jozoz4z	nrvc77uqaawbor31e1bx4c9a	t11hglcxk9l6nbn2juecgywh	SKU-t11hglcxk9l6nbn2juecgywh	69	EUR	100	0	\N	t	2025-11-25 14:54:22.417	2025-11-25 14:54:22.417	\N
vnjf715f4hto2n4vmhd835ze	nrvc77uqaawbor31e1bx4c9a	dnq1s2bky084acklqc83iuen	SKU-dnq1s2bky084acklqc83iuen	58	EUR	100	0	\N	t	2025-11-25 14:54:23.056	2025-11-25 14:54:23.056	\N
tfuqnl23ofrkdimatla73f3k	nrvc77uqaawbor31e1bx4c9a	qs95b9rw3l34f1u6rj2igl8l	SKU-qs95b9rw3l34f1u6rj2igl8l	45	EUR	100	0	\N	t	2025-11-25 14:54:23.688	2025-11-25 14:54:23.688	\N
bz5k5z5di2bav9le64jv4h3p	nrvc77uqaawbor31e1bx4c9a	q0kuondihey6m8em9y5eynui	SKU-q0kuondihey6m8em9y5eynui	45	EUR	100	0	\N	t	2025-11-25 14:54:24.323	2025-11-25 14:54:24.323	\N
cnj7gt931uz2ey1v5rvacmci	nrvc77uqaawbor31e1bx4c9a	sbq4vgmgq9lssb1vftejd8qp	SKU-sbq4vgmgq9lssb1vftejd8qp	44	EUR	100	0	\N	t	2025-11-25 14:54:24.991	2025-11-25 14:54:24.991	\N
m1a62ypwa53psrfwdnod91mc	nrvc77uqaawbor31e1bx4c9a	d75rwpnj7urwapd0uczgnma9	SKU-d75rwpnj7urwapd0uczgnma9	44	EUR	100	0	\N	t	2025-11-25 14:54:25.623	2025-11-25 14:54:25.623	\N
ek62hiz0w05hsmjlj6yet2xs	nrvc77uqaawbor31e1bx4c9a	shmcpc85jphzbmvdlaypwyeq	SKU-shmcpc85jphzbmvdlaypwyeq	35	EUR	100	0	\N	t	2025-11-25 14:54:26.256	2025-11-25 14:54:26.256	\N
diwkjufps6dbazofkw7z5gld	nrvc77uqaawbor31e1bx4c9a	utqwnvhonttsqn68iucaovl2	SKU-utqwnvhonttsqn68iucaovl2	35	EUR	100	0	\N	t	2025-11-25 14:54:26.886	2025-11-25 14:54:26.886	\N
dbqdzruu62d71qjxkw27kr16	nrvc77uqaawbor31e1bx4c9a	q07uk0vazwx16ujckh2rrpyu	SKU-q07uk0vazwx16ujckh2rrpyu	26	EUR	100	0	\N	t	2025-11-25 14:54:27.514	2025-11-25 14:54:27.514	\N
jninjuwbek0fzivvjbqtk1ix	nrvc77uqaawbor31e1bx4c9a	wljzjrwzhij59ck9lb93zlod	SKU-wljzjrwzhij59ck9lb93zlod	45	EUR	100	0	\N	t	2025-11-25 14:54:28.151	2025-11-25 14:54:28.151	\N
gv1t1zurptd7exikb9b01tvq	nrvc77uqaawbor31e1bx4c9a	ioem192270tuxyhx36kn236w	SKU-ioem192270tuxyhx36kn236w	45	EUR	100	0	\N	t	2025-11-25 14:54:28.781	2025-11-25 14:54:28.781	\N
ptvnq7r7rpjblm8u4unwnrc0	nrvc77uqaawbor31e1bx4c9a	f85a71abjwmfxusfv0yampqe	SKU-f85a71abjwmfxusfv0yampqe	68	EUR	100	0	\N	t	2025-11-25 14:54:29.412	2025-11-25 14:54:29.412	\N
a76b23skzh2zv1275uyqdztf	nrvc77uqaawbor31e1bx4c9a	man47idgtoy26u0zumby82ig	SKU-man47idgtoy26u0zumby82ig	68	EUR	100	0	\N	t	2025-11-25 14:54:30.051	2025-11-25 14:54:30.051	\N
ybhbwxnnig13ohey3299ctq7	nrvc77uqaawbor31e1bx4c9a	m20ysfxlarb3ptrw4iuad6ao	SKU-m20ysfxlarb3ptrw4iuad6ao	44	EUR	100	0	\N	t	2025-11-25 14:54:30.682	2025-11-25 14:54:30.682	\N
ht3zd5q6mf0ju2uhggnumv05	nrvc77uqaawbor31e1bx4c9a	krgt5zfcgeh43s3fq9ea43jf	SKU-krgt5zfcgeh43s3fq9ea43jf	44	EUR	100	0	\N	t	2025-11-25 14:54:31.319	2025-11-25 14:54:31.319	\N
jry86msb75odvkc7f9mwb1sd	nrvc77uqaawbor31e1bx4c9a	db3mwuuawzrzcjjafc91diek	SKU-db3mwuuawzrzcjjafc91diek	44	EUR	100	0	\N	t	2025-11-25 14:54:32.649	2025-11-25 14:54:32.649	\N
rq4jbiiykgee4gtapgwaa8oh	nrvc77uqaawbor31e1bx4c9a	m6vrd7l69b7qgct8bt0vaq2r	SKU-m6vrd7l69b7qgct8bt0vaq2r	66	EUR	100	0	\N	t	2025-11-25 14:54:33.278	2025-11-25 14:54:33.278	\N
rhr9z3ybuuwcxfpnyl5y00q1	nrvc77uqaawbor31e1bx4c9a	scg7qhdyfyv1czyncp41o33d	SKU-scg7qhdyfyv1czyncp41o33d	43	EUR	100	0	\N	t	2025-11-25 14:54:33.912	2025-11-25 14:54:33.912	\N
iv3l0j0x4ch8fjluo0rbmlhq	nrvc77uqaawbor31e1bx4c9a	x5ovmb8o9na9iu1ag9hffmx9	SKU-x5ovmb8o9na9iu1ag9hffmx9	43	EUR	100	0	\N	t	2025-11-25 14:54:34.541	2025-11-25 14:54:34.541	\N
n0klavqso1m27bby335tlbe7	nrvc77uqaawbor31e1bx4c9a	md86lewjzeq5i477jenqb8si	SKU-md86lewjzeq5i477jenqb8si	43	EUR	100	0	\N	t	2025-11-25 14:54:35.182	2025-11-25 14:54:35.182	\N
fs5e8lys9li4vsit6ep13dqq	nrvc77uqaawbor31e1bx4c9a	ihsg9xuldpapbcxa95fdfji9	SKU-ihsg9xuldpapbcxa95fdfji9	35	EUR	100	0	\N	t	2025-11-25 14:54:35.914	2025-11-25 14:54:35.914	\N
f74kfnxxz5w2tevmqc0y07eg	nrvc77uqaawbor31e1bx4c9a	m9j71wm2wuc0t3no6gy5kyrm	SKU-m9j71wm2wuc0t3no6gy5kyrm	35	EUR	100	0	\N	t	2025-11-25 14:54:36.547	2025-11-25 14:54:36.547	\N
ed95eopqdxf0xkwa2jcf43o9	nrvc77uqaawbor31e1bx4c9a	lbn0p6mq6ckubkh7pq77wu3u	SKU-lbn0p6mq6ckubkh7pq77wu3u	54	EUR	100	0	\N	t	2025-11-25 14:54:37.252	2025-11-25 14:54:37.252	\N
vw9lskhvfcl93y3jcd6j3dlh	nrvc77uqaawbor31e1bx4c9a	mobpe3nftk2m0j4lwd4ch6fx	SKU-mobpe3nftk2m0j4lwd4ch6fx	44	EUR	100	0	\N	t	2025-11-25 14:54:37.886	2025-11-25 14:54:37.886	\N
rocskga7o6ilmmtoyf8oes7r	nrvc77uqaawbor31e1bx4c9a	jwcn2zkw23s3jbyax0m4igo4	SKU-jwcn2zkw23s3jbyax0m4igo4	44	EUR	100	0	\N	t	2025-11-25 14:54:38.52	2025-11-25 14:54:38.52	\N
l34spkvqvne17f8650gi1rre	nrvc77uqaawbor31e1bx4c9a	xnxe6zpptavvtex09rsxgc76	SKU-xnxe6zpptavvtex09rsxgc76	43	EUR	100	0	\N	t	2025-11-25 14:54:39.152	2025-11-25 14:54:39.152	\N
urie3626wtzpxfvnsexp4z6q	nrvc77uqaawbor31e1bx4c9a	usukwlngo1gbmiuvcmt7fuv1	SKU-usukwlngo1gbmiuvcmt7fuv1	43	EUR	100	0	\N	t	2025-11-25 14:54:39.785	2025-11-25 14:54:39.785	\N
ez4g51e1jo4dag5ow4mmoafd	nrvc77uqaawbor31e1bx4c9a	u39yxn00hv98qc7t5bt7vn84	SKU-u39yxn00hv98qc7t5bt7vn84	68	EUR	100	0	\N	t	2025-11-25 14:54:40.416	2025-11-25 14:54:40.416	\N
fqqgown1zz17gvwo9roy58a2	nrvc77uqaawbor31e1bx4c9a	o6kfhkdfxosw1dx0v6oc7fm6	SKU-o6kfhkdfxosw1dx0v6oc7fm6	64	EUR	100	0	\N	t	2025-11-25 14:54:41.062	2025-11-25 14:54:41.062	\N
wsgz6fyfrwjntrvxfdnekuol	nrvc77uqaawbor31e1bx4c9a	m3i780qjhubavwfljyel4myp	SKU-m3i780qjhubavwfljyel4myp	38	EUR	100	0	\N	t	2025-11-25 14:54:41.697	2025-11-25 14:54:41.697	\N
v2500xqfhwb0av7rl9qkx1pn	nrvc77uqaawbor31e1bx4c9a	uno9n6rss5p4m3lxmwaey119	SKU-uno9n6rss5p4m3lxmwaey119	38	EUR	100	0	\N	t	2025-11-25 14:54:42.329	2025-11-25 14:54:42.329	\N
s6859aui284qoxfl77jlvept	nrvc77uqaawbor31e1bx4c9a	er57q5xufef4tbjtxsm0bjl7	SKU-er57q5xufef4tbjtxsm0bjl7	103	EUR	100	0	\N	t	2025-11-25 14:54:42.961	2025-11-25 14:54:42.961	\N
uruxdyptm015tsg4tyj3xtve	nrvc77uqaawbor31e1bx4c9a	c08031jmr56l87bldbvu0ckl	SKU-c08031jmr56l87bldbvu0ckl	99	EUR	100	0	\N	t	2025-11-25 14:54:43.602	2025-11-25 14:54:43.602	\N
wh3t9hd7ii0gy7l39ue419h0	nrvc77uqaawbor31e1bx4c9a	pz45a2jei8jla0kaewaqi6r2	SKU-pz45a2jei8jla0kaewaqi6r2	106	EUR	100	0	\N	t	2025-11-25 14:54:44.236	2025-11-25 14:54:44.236	\N
gf7kffabejsmk2pvqrf27slc	nrvc77uqaawbor31e1bx4c9a	h22vpok3lpvd51e674n8mddi	SKU-h22vpok3lpvd51e674n8mddi	106	EUR	100	0	\N	t	2025-11-25 14:54:44.876	2025-11-25 14:54:44.876	\N
kwrtlbp6rpoxn24wv8h9v47i	nrvc77uqaawbor31e1bx4c9a	lpu7bco6uaryavcop8hiwgj3	SKU-lpu7bco6uaryavcop8hiwgj3	61	EUR	100	0	\N	t	2025-11-25 14:54:45.515	2025-11-25 14:54:45.515	\N
dj498m2jjoquzeyjfe3yrcql	nrvc77uqaawbor31e1bx4c9a	wb227bls6mhj7mdyamjxam2h	SKU-wb227bls6mhj7mdyamjxam2h	64	EUR	100	0	\N	t	2025-11-25 14:54:46.151	2025-11-25 14:54:46.151	\N
kc37u3geojaufwkn6rjwtjjl	nrvc77uqaawbor31e1bx4c9a	w3h8ybty87lstazhs56wl0sw	SKU-w3h8ybty87lstazhs56wl0sw	64	EUR	100	0	\N	t	2025-11-25 14:54:46.793	2025-11-25 14:54:46.793	\N
ghi4roz8gpm4zjvgu3v0o720	nrvc77uqaawbor31e1bx4c9a	e148ftvfbvqn79qne4pcebf6	SKU-e148ftvfbvqn79qne4pcebf6	67	EUR	100	0	\N	t	2025-11-25 14:54:47.433	2025-11-25 14:54:47.433	\N
sjwxhoixpj1ux6z3gzokt5xb	nrvc77uqaawbor31e1bx4c9a	svj0eqlgqpqh9atonp3ccg6h	SKU-svj0eqlgqpqh9atonp3ccg6h	81	EUR	100	0	\N	t	2025-11-25 14:54:48.075	2025-11-25 14:54:48.075	\N
h97b9usolhmsxm3ytabwxzyt	nrvc77uqaawbor31e1bx4c9a	gctepm75ejf5zamxbabjven1	SKU-gctepm75ejf5zamxbabjven1	109	EUR	100	0	\N	t	2025-11-25 14:54:48.707	2025-11-25 14:54:48.707	\N
vhxm3tn0kkcez17cm4nlh64d	nrvc77uqaawbor31e1bx4c9a	ezkh1d5m8hbzybao59zeih8z	SKU-ezkh1d5m8hbzybao59zeih8z	109	EUR	100	0	\N	t	2025-11-25 14:54:49.341	2025-11-25 14:54:49.341	\N
yzidi3m2ufak9ptsjrx486ay	nrvc77uqaawbor31e1bx4c9a	d4sbbdn1650frjgoxgc6ra9t	SKU-d4sbbdn1650frjgoxgc6ra9t	109	EUR	100	0	\N	t	2025-11-25 14:54:49.987	2025-11-25 14:54:49.987	\N
ppsfmj7m8cstccmd8bqhjec6	nrvc77uqaawbor31e1bx4c9a	w4vmhbk118wwtftsohb1wkgq	SKU-w4vmhbk118wwtftsohb1wkgq	109	EUR	100	0	\N	t	2025-11-25 14:54:50.625	2025-11-25 14:54:50.625	\N
nexbkt8t5fk138ww8veyk9kr	nrvc77uqaawbor31e1bx4c9a	vvkpc49nwgosjb5jc739w7jx	SKU-vvkpc49nwgosjb5jc739w7jx	109	EUR	100	0	\N	t	2025-11-25 14:54:51.259	2025-11-25 14:54:51.259	\N
xgmo000q0wx9t5354wadv9z2	nrvc77uqaawbor31e1bx4c9a	v2r3oxc97o2imjlv1hkvem9u	SKU-v2r3oxc97o2imjlv1hkvem9u	109	EUR	100	0	\N	t	2025-11-25 14:54:51.968	2025-11-25 14:54:51.968	\N
imfvuo1psgikzeguc73n2gam	nrvc77uqaawbor31e1bx4c9a	jwh9b417sjkns8kovtwrvjj5	SKU-jwh9b417sjkns8kovtwrvjj5	87	EUR	100	0	\N	t	2025-11-25 14:54:52.603	2025-11-25 14:54:52.603	\N
hvgvp1bsmqkqc31vxpzwzpgi	nrvc77uqaawbor31e1bx4c9a	hsecg6irhpuohx22yj3125ad	SKU-hsecg6irhpuohx22yj3125ad	87	EUR	100	0	\N	t	2025-11-25 14:54:53.258	2025-11-25 14:54:53.258	\N
h2fpritsq34qb0vqd7wyv3ok	nrvc77uqaawbor31e1bx4c9a	js089uivo23rrj2byl9ay0ld	SKU-js089uivo23rrj2byl9ay0ld	87	EUR	100	0	\N	t	2025-11-25 14:54:53.894	2025-11-25 14:54:53.894	\N
t4l5kaabz9khbifux1f0iatw	nrvc77uqaawbor31e1bx4c9a	r5soq13dwn8ckuhfevt1382w	SKU-r5soq13dwn8ckuhfevt1382w	87	EUR	100	0	\N	t	2025-11-25 14:54:54.539	2025-11-25 14:54:54.539	\N
iveu6hdiboq7mb4e5ewy9jda	nrvc77uqaawbor31e1bx4c9a	tpk9r7emyn29lufhmx9yeeem	SKU-tpk9r7emyn29lufhmx9yeeem	87	EUR	100	0	\N	t	2025-11-25 14:54:55.175	2025-11-25 14:54:55.175	\N
i3a0tw4r7xgx03qlb4o8uila	nrvc77uqaawbor31e1bx4c9a	zid1ljb37wanx8i557k7rpnv	SKU-zid1ljb37wanx8i557k7rpnv	87	EUR	100	0	\N	t	2025-11-25 14:54:55.807	2025-11-25 14:54:55.807	\N
xsyqm77fyjyqj4yqjz9w995m	nrvc77uqaawbor31e1bx4c9a	t7z0qd6d1cdc3m0i2k5vqwls	SKU-t7z0qd6d1cdc3m0i2k5vqwls	87	EUR	100	0	\N	t	2025-11-25 14:54:56.442	2025-11-25 14:54:56.442	\N
xnmfkyp3xtnjrntqllzvcgii	nrvc77uqaawbor31e1bx4c9a	txn59o9d6dl373t1tdqrehmb	SKU-txn59o9d6dl373t1tdqrehmb	87	EUR	100	0	\N	t	2025-11-25 14:54:57.083	2025-11-25 14:54:57.083	\N
wheie8fr3rgand2oqglntgc4	nrvc77uqaawbor31e1bx4c9a	hnrqqkuk90x2b1lksn15a93c	SKU-hnrqqkuk90x2b1lksn15a93c	87	EUR	100	0	\N	t	2025-11-25 14:54:57.717	2025-11-25 14:54:57.717	\N
e5wlr10oxxzi6owe1tzxxmpo	nrvc77uqaawbor31e1bx4c9a	odre5xisr33q7ob2zpv29euq	SKU-odre5xisr33q7ob2zpv29euq	87	EUR	100	0	\N	t	2025-11-25 14:54:58.348	2025-11-25 14:54:58.348	\N
bclfvm42o73pc8v1jkjcd4vk	nrvc77uqaawbor31e1bx4c9a	b0dletfxlw4j3k12yquc0xpc	SKU-b0dletfxlw4j3k12yquc0xpc	59	EUR	100	0	\N	t	2025-11-25 14:54:58.982	2025-11-25 14:54:58.982	\N
jzirz8ownavyqencdwbkxo5s	nrvc77uqaawbor31e1bx4c9a	m1dr6ovy8hmu7utwoikzku38	SKU-m1dr6ovy8hmu7utwoikzku38	59	EUR	100	0	\N	t	2025-11-25 14:54:59.618	2025-11-25 14:54:59.618	\N
bjjanvu8a2qjl1aaeu8ngxkj	nrvc77uqaawbor31e1bx4c9a	w209uhgn0l8pn3nyk8fsinxa	SKU-w209uhgn0l8pn3nyk8fsinxa	59	EUR	100	0	\N	t	2025-11-25 14:55:00.329	2025-11-25 14:55:00.329	\N
plrqfl2ejrikq872vtpo8mf0	nrvc77uqaawbor31e1bx4c9a	urq5jisoxu0dl8fpmvaqxoxq	SKU-urq5jisoxu0dl8fpmvaqxoxq	56	EUR	100	0	\N	t	2025-11-25 14:55:00.962	2025-11-25 14:55:00.962	\N
qsm6elkwu64fld56opzzop6z	nrvc77uqaawbor31e1bx4c9a	kpxajgnrscqlwll4wvhwh1a6	SKU-kpxajgnrscqlwll4wvhwh1a6	119	EUR	100	0	\N	t	2025-11-25 14:55:01.594	2025-11-25 14:55:01.594	\N
forikw05reogdpv4cfajm4dj	nrvc77uqaawbor31e1bx4c9a	novzjisda935oh4vbnqubqz0	SKU-novzjisda935oh4vbnqubqz0	119	EUR	100	0	\N	t	2025-11-25 14:55:02.263	2025-11-25 14:55:02.263	\N
fkjvndyji3rjw3qm5f1tost2	nrvc77uqaawbor31e1bx4c9a	ikvqul510wkz674qdkoi6ixw	SKU-ikvqul510wkz674qdkoi6ixw	119	EUR	100	0	\N	t	2025-11-25 14:55:02.892	2025-11-25 14:55:02.892	\N
p1cith4xylqicbblbn10xiyd	nrvc77uqaawbor31e1bx4c9a	fg0xbcpfmx615dd8cq4qmlps	SKU-fg0xbcpfmx615dd8cq4qmlps	119	EUR	100	0	\N	t	2025-11-25 14:55:03.527	2025-11-25 14:55:03.527	\N
rhb4kn1bfp7sbtt6to2i7ncc	nrvc77uqaawbor31e1bx4c9a	ss3bfcm8sqr6o6xo1pkkoi4v	SKU-ss3bfcm8sqr6o6xo1pkkoi4v	56	EUR	100	0	\N	t	2025-11-25 14:55:04.159	2025-11-25 14:55:04.159	\N
rd2ou8o0g3err5ne92d45u31	nrvc77uqaawbor31e1bx4c9a	d9m8jw1dnnjfge5u1ur7wywr	SKU-d9m8jw1dnnjfge5u1ur7wywr	62	EUR	100	0	\N	t	2025-11-25 14:55:04.793	2025-11-25 14:55:04.793	\N
mdsdatmex7ueaeszraiwoen7	nrvc77uqaawbor31e1bx4c9a	lm0f0ytgy1te7uhw4lhvxbvn	SKU-lm0f0ytgy1te7uhw4lhvxbvn	75	EUR	100	0	\N	t	2025-11-25 14:55:05.435	2025-11-25 14:55:05.435	\N
j4t5b8n15ios7wriejqs1ws2	nrvc77uqaawbor31e1bx4c9a	swsoescqfa9o0zt4lu3g28mh	SKU-swsoescqfa9o0zt4lu3g28mh	2924	EUR	100	0	\N	t	2025-11-25 15:06:56.53	2025-11-25 15:06:56.53	\N
tojz9zom94t9772ltmgkp4c5	nrvc77uqaawbor31e1bx4c9a	gsw7boakxtzbl2st004kvrr7	SKU-gsw7boakxtzbl2st004kvrr7	528	EUR	100	0	\N	t	2025-11-25 15:06:57.162	2025-11-25 15:06:57.162	\N
oyvg1wzkxc7ck82381o9u4d7	nrvc77uqaawbor31e1bx4c9a	k9o4dptz1fdjrk5l4k4dqtfm	SKU-k9o4dptz1fdjrk5l4k4dqtfm	1955	EUR	100	0	\N	t	2025-11-25 15:06:57.794	2025-11-25 15:06:57.794	\N
j6kuqk3f2x0662iery9qdllj	nrvc77uqaawbor31e1bx4c9a	p5w0964vzcfnxqhc2uhmwkcg	SKU-p5w0964vzcfnxqhc2uhmwkcg	1768	EUR	100	0	\N	t	2025-11-25 15:06:58.423	2025-11-25 15:06:58.423	\N
fmydlv5cjujnbf1snjhiw3ik	nrvc77uqaawbor31e1bx4c9a	c3vs0qnjnyhm1e1gvuqdsqhk	SKU-c3vs0qnjnyhm1e1gvuqdsqhk	660	EUR	100	0	\N	t	2025-11-25 15:06:59.055	2025-11-25 15:06:59.055	\N
o3tx57idezlb39b493eloema	nrvc77uqaawbor31e1bx4c9a	w5h8b1if006892pgh7uwimwx	SKU-w5h8b1if006892pgh7uwimwx	3825	EUR	100	0	\N	t	2025-11-25 15:06:59.687	2025-11-25 15:06:59.687	\N
bn0l95ccfrdcwc94ke9peco6	nrvc77uqaawbor31e1bx4c9a	m5t6q6hwqrmn2775rhepjqz3	SKU-m5t6q6hwqrmn2775rhepjqz3	534	EUR	100	0	\N	t	2025-11-25 15:07:00.321	2025-11-25 15:07:00.321	\N
xlwdzd4ud457hg433ivy8av7	nrvc77uqaawbor31e1bx4c9a	mbba7rcpvief090sk4uflb4l	SKU-mbba7rcpvief090sk4uflb4l	1726	EUR	100	0	\N	t	2025-11-25 15:07:00.984	2025-11-25 15:07:00.984	\N
j6un0c29420xnlqm6zfjs3xg	nrvc77uqaawbor31e1bx4c9a	djipi8o2pgsm6gp92nrnxdpy	SKU-djipi8o2pgsm6gp92nrnxdpy	1303	EUR	100	0	\N	t	2025-11-25 15:07:01.634	2025-11-25 15:07:01.634	\N
ri4bu14elafhgqviyk8yn5vq	nrvc77uqaawbor31e1bx4c9a	f1qlsivamgkyke81v5wmap5h	SKU-f1qlsivamgkyke81v5wmap5h	5058	EUR	100	0	\N	t	2025-11-25 15:07:02.264	2025-11-25 15:07:02.264	\N
qcxs2i3jtzbo4tt0yjx3lx02	nrvc77uqaawbor31e1bx4c9a	xhxn8sftbn07o0jxwzefunys	SKU-xhxn8sftbn07o0jxwzefunys	927	EUR	100	0	\N	t	2025-11-25 15:07:02.891	2025-11-25 15:07:02.891	\N
oqbh4slipfxiyx551nv1ny6y	nrvc77uqaawbor31e1bx4c9a	uzux6rqu3zr6ku3t6bym5m56	SKU-uzux6rqu3zr6ku3t6bym5m56	1159	EUR	100	0	\N	t	2025-11-25 15:07:03.522	2025-11-25 15:07:03.522	\N
pgsoxi4cgonbvdlgsgunmrvy	nrvc77uqaawbor31e1bx4c9a	edf6vevd7yij287t8cmp38k7	SKU-edf6vevd7yij287t8cmp38k7	1159	EUR	100	0	\N	t	2025-11-25 15:07:04.153	2025-11-25 15:07:04.153	\N
aqehd3l6ga2w25ht3dyyhqyu	nrvc77uqaawbor31e1bx4c9a	oqjsj0amp133igsve1a6h0mw	SKU-oqjsj0amp133igsve1a6h0mw	524	EUR	100	0	\N	t	2025-11-25 15:07:04.792	2025-11-25 15:07:04.792	\N
m6gsuy6zp28th5nhqqtthef3	nrvc77uqaawbor31e1bx4c9a	ce3kjf4luclwbwv9mwp18pgz	SKU-ce3kjf4luclwbwv9mwp18pgz	315	EUR	100	0	\N	t	2025-11-25 15:07:05.427	2025-11-25 15:07:05.427	\N
k6f3taym57eeernbth8q3rbt	nrvc77uqaawbor31e1bx4c9a	r1xcnp269dm7p0cl9mhxonwj	SKU-r1xcnp269dm7p0cl9mhxonwj	581	EUR	100	0	\N	t	2025-11-25 15:07:06.06	2025-11-25 15:07:06.06	\N
jjsl2poacm432xv6mw407ok1	nrvc77uqaawbor31e1bx4c9a	snr1mbv1a9uqi54nyo1f4tyv	SKU-snr1mbv1a9uqi54nyo1f4tyv	931	EUR	100	0	\N	t	2025-11-25 15:07:06.69	2025-11-25 15:07:06.69	\N
chl49d776028sp0q3etr73b8	nrvc77uqaawbor31e1bx4c9a	qhlwlxd2cbqt37zpog12usfi	SKU-qhlwlxd2cbqt37zpog12usfi	850	EUR	100	0	\N	t	2025-11-25 15:07:07.319	2025-11-25 15:07:07.319	\N
m3tn39rl0890fakiji9x45xd	nrvc77uqaawbor31e1bx4c9a	bko5fhsbv15ku89d0c9n7mml	SKU-bko5fhsbv15ku89d0c9n7mml	589	EUR	100	0	\N	t	2025-11-25 15:07:07.95	2025-11-25 15:07:07.95	\N
t2sek0sza3iczqlah8k1ajyc	nrvc77uqaawbor31e1bx4c9a	mtuj3wcfu347ehqcbhw1dip5	SKU-mtuj3wcfu347ehqcbhw1dip5	999	EUR	100	0	\N	t	2025-11-25 15:07:08.581	2025-11-25 15:07:08.581	\N
uowl6wvjwvfsn6cf994dichs	nrvc77uqaawbor31e1bx4c9a	got76t88ejrurujpsmbdo4wu	SKU-got76t88ejrurujpsmbdo4wu	1063	EUR	100	0	\N	t	2025-11-25 15:07:09.227	2025-11-25 15:07:09.227	\N
yjyp0t41x5v2agm2zpdzbw9p	nrvc77uqaawbor31e1bx4c9a	be0cy9xltc7cwt0c3yc3bm90	SKU-be0cy9xltc7cwt0c3yc3bm90	740	EUR	100	0	\N	t	2025-11-25 15:07:09.86	2025-11-25 15:07:09.86	\N
ar96r6rcfelmamuj0qih1f38	nrvc77uqaawbor31e1bx4c9a	rox0bue2296uc7bbgbb830nr	SKU-rox0bue2296uc7bbgbb830nr	5831	EUR	100	0	\N	t	2025-11-25 15:07:10.494	2025-11-25 15:07:10.494	\N
kjmu9pj3ceirjsl13uqpy46j	nrvc77uqaawbor31e1bx4c9a	zpwnqqj12bopjbzq7arjgwmk	SKU-zpwnqqj12bopjbzq7arjgwmk	564	EUR	100	0	\N	t	2025-11-25 15:07:11.124	2025-11-25 15:07:11.124	\N
gpeqalc77h4pv60xswlgc92u	nrvc77uqaawbor31e1bx4c9a	t0ropoou9qw3rymhrkf9av0e	SKU-t0ropoou9qw3rymhrkf9av0e	493	EUR	100	0	\N	t	2025-11-25 15:07:11.83	2025-11-25 15:07:11.83	\N
sk415eyi6jzk4yt544dxc7dr	nrvc77uqaawbor31e1bx4c9a	edlurfvt68zvta2i84vwfwcm	SKU-edlurfvt68zvta2i84vwfwcm	513	EUR	100	0	\N	t	2025-11-25 15:07:12.463	2025-11-25 15:07:12.463	\N
t5notaou78f8eg64obkih9n2	nrvc77uqaawbor31e1bx4c9a	tic0cef01fuf5lg21llsufeu	SKU-tic0cef01fuf5lg21llsufeu	347	EUR	100	0	\N	t	2025-11-25 15:07:13.156	2025-11-25 15:07:13.156	\N
wvx8uqs79ryxza1z0hqdrsqf	nrvc77uqaawbor31e1bx4c9a	qg0n1apnzi7jqpbn7w1b8e91	SKU-qg0n1apnzi7jqpbn7w1b8e91	680	EUR	100	0	\N	t	2025-11-25 15:07:13.88	2025-11-25 15:07:13.88	\N
lumobsfdj6cb517nfr30mkn8	nrvc77uqaawbor31e1bx4c9a	q5an3b8aj11rx12otkqktknw	SKU-q5an3b8aj11rx12otkqktknw	772	EUR	100	0	\N	t	2025-11-25 15:07:14.517	2025-11-25 15:07:14.517	\N
jsu85nn8vot4nhxq6m9ruqrd	nrvc77uqaawbor31e1bx4c9a	ibvqgvepo4hoexdnr02et7pj	SKU-ibvqgvepo4hoexdnr02et7pj	2933	EUR	100	0	\N	t	2025-11-25 15:07:15.389	2025-11-25 15:07:15.389	\N
up9h6lqu7zgrgcf7g4qjks2n	nrvc77uqaawbor31e1bx4c9a	x7etscfxv212bgy42awbsndf	SKU-x7etscfxv212bgy42awbsndf	2890	EUR	100	0	\N	t	2025-11-25 15:07:16.022	2025-11-25 15:07:16.022	\N
ni218dviw00ze2yl3049iwmp	nrvc77uqaawbor31e1bx4c9a	xn88o6qqpkdmbrnnb0njha53	SKU-xn88o6qqpkdmbrnnb0njha53	895	EUR	100	0	\N	t	2025-11-25 15:07:16.683	2025-11-25 15:07:16.683	\N
z284vv5qdd5yc3zahusil9ll	nrvc77uqaawbor31e1bx4c9a	hmu8188zqb1bw75oxgm5v0is	SKU-hmu8188zqb1bw75oxgm5v0is	1828	EUR	100	0	\N	t	2025-11-25 15:07:17.335	2025-11-25 15:07:17.335	\N
j18b1ifdesub05kqi1jhhj1t	nrvc77uqaawbor31e1bx4c9a	a5arfqt25m27qr1a0xufxtcs	SKU-a5arfqt25m27qr1a0xufxtcs	1165	EUR	100	0	\N	t	2025-11-25 15:07:17.967	2025-11-25 15:07:17.967	\N
yuyn7mgv6rva9sxjeguvqwqr	nrvc77uqaawbor31e1bx4c9a	k3hrdgifxqhx646rrwk21p7i	SKU-k3hrdgifxqhx646rrwk21p7i	1148	EUR	100	0	\N	t	2025-11-25 15:07:18.596	2025-11-25 15:07:18.596	\N
d111auvhdou2094zv4fxc8bt	nrvc77uqaawbor31e1bx4c9a	btgsgxs5pdhnsenpmyf21bkt	SKU-btgsgxs5pdhnsenpmyf21bkt	419	EUR	100	0	\N	t	2025-11-25 15:07:19.225	2025-11-25 15:07:19.225	\N
l9wffpi5ybqr0ix9ea5h9wb8	nrvc77uqaawbor31e1bx4c9a	bx5u732myo1k92rm2zyheqcl	SKU-bx5u732myo1k92rm2zyheqcl	1063	EUR	100	0	\N	t	2025-11-25 15:07:19.856	2025-11-25 15:07:19.856	\N
a90g0f0c2kkn5zfg1uhdo1ny	nrvc77uqaawbor31e1bx4c9a	muon93twacodhjs59z56r4pa	SKU-muon93twacodhjs59z56r4pa	829	EUR	100	0	\N	t	2025-11-25 15:07:20.514	2025-11-25 15:07:20.514	\N
dbfzyi4119nj2ucokyhp1afd	nrvc77uqaawbor31e1bx4c9a	cvgejf963ndsvsbfi4p7ve2q	SKU-cvgejf963ndsvsbfi4p7ve2q	1509	EUR	100	0	\N	t	2025-11-25 15:07:21.15	2025-11-25 15:07:21.15	\N
qqqq13in42r6bq596hx7bz4e	nrvc77uqaawbor31e1bx4c9a	gu9g6b4rckbhv4kvtu5svyvh	SKU-gu9g6b4rckbhv4kvtu5svyvh	3111	EUR	100	0	\N	t	2025-11-25 15:07:21.781	2025-11-25 15:07:21.781	\N
iqt6bl12hcp6dg0lhy9jpoqg	nrvc77uqaawbor31e1bx4c9a	d7wa921kroz5ydwbq41chn2o	SKU-d7wa921kroz5ydwbq41chn2o	1031	EUR	100	0	\N	t	2025-11-25 15:07:22.41	2025-11-25 15:07:22.41	\N
ncplaawhtl9o4xnxkl6smcbq	nrvc77uqaawbor31e1bx4c9a	e7lnm7p4vhrilbiy62d1fmth	SKU-e7lnm7p4vhrilbiy62d1fmth	673	EUR	100	0	\N	t	2025-11-25 15:07:23.048	2025-11-25 15:07:23.048	\N
edd1linppm87e6uve88mfmyc	nrvc77uqaawbor31e1bx4c9a	t4lqia2h7yuyglujatb9nm2s	SKU-t4lqia2h7yuyglujatb9nm2s	1420	EUR	100	0	\N	t	2025-11-25 15:07:23.684	2025-11-25 15:07:23.684	\N
c7wkkokb48weuxsn2u87ctlm	nrvc77uqaawbor31e1bx4c9a	zov28o2fue5jnckibvwx6czg	SKU-zov28o2fue5jnckibvwx6czg	75	EUR	100	0	\N	t	2025-11-25 14:55:06.072	2025-11-25 14:55:06.072	\N
lpkyr8vq7qge03crv6dlxtp8	nrvc77uqaawbor31e1bx4c9a	qihugcduy665j33swlqbn9j6	SKU-qihugcduy665j33swlqbn9j6	75	EUR	100	0	\N	t	2025-11-25 14:55:06.703	2025-11-25 14:55:06.703	\N
wmsdl5gphcjjvujn18d80jvj	nrvc77uqaawbor31e1bx4c9a	fxbuoxpb8q17o79nmpwkua3v	SKU-fxbuoxpb8q17o79nmpwkua3v	75	EUR	100	0	\N	t	2025-11-25 14:55:07.407	2025-11-25 14:55:07.407	\N
w4rhhadakka04fs552313iml	nrvc77uqaawbor31e1bx4c9a	v38861iint5s3ycbytk53d1h	SKU-v38861iint5s3ycbytk53d1h	75	EUR	100	0	\N	t	2025-11-25 14:55:08.038	2025-11-25 14:55:08.038	\N
yxt4r9s8zs0knqj1lv1llvaf	nrvc77uqaawbor31e1bx4c9a	z5ppfns0wors6jwnpqegh8db	SKU-z5ppfns0wors6jwnpqegh8db	75	EUR	100	0	\N	t	2025-11-25 14:55:08.666	2025-11-25 14:55:08.666	\N
n5etsr5ythx2229w2dguczcd	nrvc77uqaawbor31e1bx4c9a	rq72qn8sf0z4vzlwqlktewlu	SKU-rq72qn8sf0z4vzlwqlktewlu	75	EUR	100	0	\N	t	2025-11-25 14:55:09.301	2025-11-25 14:55:09.301	\N
xlo879sjxtkpkldfqys0p6i1	nrvc77uqaawbor31e1bx4c9a	d21osg2sjpr0htr5i1hygnl4	SKU-d21osg2sjpr0htr5i1hygnl4	67	EUR	100	0	\N	t	2025-11-25 14:55:09.935	2025-11-25 14:55:09.935	\N
xa1m1owchoet4hmitvd5ya7s	nrvc77uqaawbor31e1bx4c9a	bwl4fqm1i4lcx62xln5r49kr	SKU-bwl4fqm1i4lcx62xln5r49kr	78	EUR	100	0	\N	t	2025-11-25 14:55:10.569	2025-11-25 14:55:10.569	\N
szx4wljxvedokrvptdgzcm1n	nrvc77uqaawbor31e1bx4c9a	av4b77189fm8koizh6f74flb	SKU-av4b77189fm8koizh6f74flb	78	EUR	100	0	\N	t	2025-11-25 14:55:11.207	2025-11-25 14:55:11.207	\N
ol22l6lptsk5jtpt4beuc44m	nrvc77uqaawbor31e1bx4c9a	sv8agd0h7u0s772jklw160uh	SKU-sv8agd0h7u0s772jklw160uh	67	EUR	100	0	\N	t	2025-11-25 14:55:11.846	2025-11-25 14:55:11.846	\N
ko8hop8j8urfnoojukx6ei0w	nrvc77uqaawbor31e1bx4c9a	xnji7incarfzyba0kicyjhjb	SKU-xnji7incarfzyba0kicyjhjb	67	EUR	100	0	\N	t	2025-11-25 14:55:12.48	2025-11-25 14:55:12.48	\N
wmk4ewsadgyqbp7zbzusm6e4	nrvc77uqaawbor31e1bx4c9a	oocz7i95ceqnmu7eee3h22lt	SKU-oocz7i95ceqnmu7eee3h22lt	104	EUR	100	0	\N	t	2025-11-25 14:55:13.116	2025-11-25 14:55:13.116	\N
ou9vpjla1husw91wyiyvp288	nrvc77uqaawbor31e1bx4c9a	lc98gd2ok9rb69v6trfjx5em	SKU-lc98gd2ok9rb69v6trfjx5em	104	EUR	100	0	\N	t	2025-11-25 14:55:13.749	2025-11-25 14:55:13.749	\N
unbbxf3mgzujbnllkld0xmvy	nrvc77uqaawbor31e1bx4c9a	nzem0wyrtcogooftxqoo2sd1	SKU-nzem0wyrtcogooftxqoo2sd1	104	EUR	100	0	\N	t	2025-11-25 14:55:14.381	2025-11-25 14:55:14.381	\N
v99j49bm0qlezu8yxklt8n12	nrvc77uqaawbor31e1bx4c9a	pqwi2mc51lyuog1m32b923h2	SKU-pqwi2mc51lyuog1m32b923h2	78	EUR	100	0	\N	t	2025-11-25 14:55:15.01	2025-11-25 14:55:15.01	\N
rzhuiwz9ek5cmmfnz3gye2sd	nrvc77uqaawbor31e1bx4c9a	no1fiiswejceloe34wx6oeke	SKU-no1fiiswejceloe34wx6oeke	67	EUR	100	0	\N	t	2025-11-25 14:55:15.644	2025-11-25 14:55:15.644	\N
v0xk59fxnbotx8k1eojbh0ek	nrvc77uqaawbor31e1bx4c9a	he8cib9qz6elkrgm3xc31vqg	SKU-he8cib9qz6elkrgm3xc31vqg	84	EUR	100	0	\N	t	2025-11-25 14:55:16.286	2025-11-25 14:55:16.286	\N
uoyu23zd8vi00j9y4slmmaz7	nrvc77uqaawbor31e1bx4c9a	qjn5iz9y0i0ohfnwkkn2m2rr	SKU-qjn5iz9y0i0ohfnwkkn2m2rr	84	EUR	100	0	\N	t	2025-11-25 14:55:16.919	2025-11-25 14:55:16.919	\N
szb3c8qlos0gf9pswrg182dg	nrvc77uqaawbor31e1bx4c9a	vtpcovq24m3hukga8w42o79e	SKU-vtpcovq24m3hukga8w42o79e	84	EUR	100	0	\N	t	2025-11-25 14:55:17.553	2025-11-25 14:55:17.553	\N
e5jic8diyjbbksni7kye7s93	nrvc77uqaawbor31e1bx4c9a	khe7fva1vhrk2wzl54mc0061	SKU-khe7fva1vhrk2wzl54mc0061	84	EUR	100	0	\N	t	2025-11-25 14:55:18.181	2025-11-25 14:55:18.181	\N
jshewk97e4985dehi155thkg	nrvc77uqaawbor31e1bx4c9a	afqvhhhfug52j3xuqhbjr42n	SKU-afqvhhhfug52j3xuqhbjr42n	84	EUR	100	0	\N	t	2025-11-25 14:55:18.819	2025-11-25 14:55:18.819	\N
mzlltnnqig9fm3o5th2x8gez	nrvc77uqaawbor31e1bx4c9a	m0sqn73nr4eipo08u1yn8gd2	SKU-m0sqn73nr4eipo08u1yn8gd2	84	EUR	100	0	\N	t	2025-11-25 14:55:19.501	2025-11-25 14:55:19.501	\N
yqp9p607993hu1oxu9p109lt	nrvc77uqaawbor31e1bx4c9a	b1p9chln1a3o3dcmc0ou2259	SKU-b1p9chln1a3o3dcmc0ou2259	84	EUR	100	0	\N	t	2025-11-25 14:55:20.135	2025-11-25 14:55:20.135	\N
v341dx064q3ycbnc7q4moo50	nrvc77uqaawbor31e1bx4c9a	a3rqr1h24xjm1qoxtgvf2lhj	SKU-a3rqr1h24xjm1qoxtgvf2lhj	54	EUR	100	0	\N	t	2025-11-25 14:55:20.811	2025-11-25 14:55:20.811	\N
a82qj1svktl54oefzxnvnj9u	nrvc77uqaawbor31e1bx4c9a	lh5wb6enc4awljizq545nseu	SKU-lh5wb6enc4awljizq545nseu	54	EUR	100	0	\N	t	2025-11-25 14:55:21.447	2025-11-25 14:55:21.447	\N
pwl7rig6d4yrvwuo9hpfsjmu	nrvc77uqaawbor31e1bx4c9a	xv7rsozisz5o4f0wky7mbrki	SKU-xv7rsozisz5o4f0wky7mbrki	122	EUR	100	0	\N	t	2025-11-25 14:55:22.085	2025-11-25 14:55:22.085	\N
ssa97kybb6imp9vqbjz0pe03	nrvc77uqaawbor31e1bx4c9a	s3f1iao1qv2075dnprnevi9i	SKU-s3f1iao1qv2075dnprnevi9i	122	EUR	100	0	\N	t	2025-11-25 14:55:22.789	2025-11-25 14:55:22.789	\N
v8bebfhwcvknx3522veetdfm	nrvc77uqaawbor31e1bx4c9a	hg6lr08ewbjebupdbq0z7i14	SKU-hg6lr08ewbjebupdbq0z7i14	131	EUR	100	0	\N	t	2025-11-25 14:55:23.42	2025-11-25 14:55:23.42	\N
cpx0bictiyvr43t5jsjw2m8l	nrvc77uqaawbor31e1bx4c9a	vgz155qszvvidd2rgsjjzg65	SKU-vgz155qszvvidd2rgsjjzg65	131	EUR	100	0	\N	t	2025-11-25 14:55:24.059	2025-11-25 14:55:24.059	\N
zg6zsv2j7q3ph72zfegbotrb	nrvc77uqaawbor31e1bx4c9a	gvrp4hqiw6yzjsx1ry7hwfiz	SKU-gvrp4hqiw6yzjsx1ry7hwfiz	131	EUR	100	0	\N	t	2025-11-25 14:55:24.696	2025-11-25 14:55:24.696	\N
hf02usiqq9wkvzzvwteievti	nrvc77uqaawbor31e1bx4c9a	c6ugoqzpqt4i5v7xkub7o8n2	SKU-c6ugoqzpqt4i5v7xkub7o8n2	131	EUR	100	0	\N	t	2025-11-25 14:55:25.331	2025-11-25 14:55:25.331	\N
xa9sxcuy14ayis9egf0fg4x1	nrvc77uqaawbor31e1bx4c9a	nld2sbrkek84hjeckn47d7f1	SKU-nld2sbrkek84hjeckn47d7f1	103	EUR	100	0	\N	t	2025-11-25 14:55:25.964	2025-11-25 14:55:25.964	\N
ets7dyy03uqdm3u8z795o6f8	nrvc77uqaawbor31e1bx4c9a	ld10mqwwuc63smbx58sgk7xe	SKU-ld10mqwwuc63smbx58sgk7xe	103	EUR	100	0	\N	t	2025-11-25 14:55:26.597	2025-11-25 14:55:26.597	\N
cxjr1j5yiuo41qgon4lq44bp	nrvc77uqaawbor31e1bx4c9a	zmswrxuj8hohjcmg1mkzm9z1	SKU-zmswrxuj8hohjcmg1mkzm9z1	103	EUR	100	0	\N	t	2025-11-25 14:55:27.231	2025-11-25 14:55:27.231	\N
ecbqqxgzq1grt8mr6atp3erq	nrvc77uqaawbor31e1bx4c9a	azve1oy3rp988lxtdar475kf	SKU-azve1oy3rp988lxtdar475kf	81	EUR	100	0	\N	t	2025-11-25 14:55:27.869	2025-11-25 14:55:27.869	\N
wwxh7fsmf74bspce5dijnqef	nrvc77uqaawbor31e1bx4c9a	dzpjjh21pt5qhnnx3szavkxa	SKU-dzpjjh21pt5qhnnx3szavkxa	81	EUR	100	0	\N	t	2025-11-25 14:55:28.502	2025-11-25 14:55:28.502	\N
vpn3gxs6sdiwv68sq93wu1hh	nrvc77uqaawbor31e1bx4c9a	vro2nxo95gm8uh360419eaw6	SKU-vro2nxo95gm8uh360419eaw6	81	EUR	100	0	\N	t	2025-11-25 14:55:29.134	2025-11-25 14:55:29.134	\N
n5q5jzuevv1wozk8k6bca9he	nrvc77uqaawbor31e1bx4c9a	oxyw5srcyxk06m4mixptuq05	SKU-oxyw5srcyxk06m4mixptuq05	81	EUR	100	0	\N	t	2025-11-25 14:55:29.771	2025-11-25 14:55:29.771	\N
a1ggskfxuj6p9buhaufs6732	nrvc77uqaawbor31e1bx4c9a	us1rodpafx2xa7i57913vycu	SKU-us1rodpafx2xa7i57913vycu	118	EUR	100	0	\N	t	2025-11-25 14:55:30.409	2025-11-25 14:55:30.409	\N
bz2tmna6qyrlc0hq656q0d2m	nrvc77uqaawbor31e1bx4c9a	v1759z2f6j0e34v4w9uaqv2v	SKU-v1759z2f6j0e34v4w9uaqv2v	118	EUR	100	0	\N	t	2025-11-25 14:55:31.111	2025-11-25 14:55:31.111	\N
sercwp8n55k86hfrv5wvoit8	nrvc77uqaawbor31e1bx4c9a	u3k3kolycb7q0i8mckkw4wci	SKU-u3k3kolycb7q0i8mckkw4wci	118	EUR	100	0	\N	t	2025-11-25 14:55:31.749	2025-11-25 14:55:31.749	\N
qpczqzoiqtz7ia5q1usfxuv6	nrvc77uqaawbor31e1bx4c9a	pfjxmxorh8wcoivl6e46j0lk	SKU-pfjxmxorh8wcoivl6e46j0lk	118	EUR	100	0	\N	t	2025-11-25 14:55:32.383	2025-11-25 14:55:32.383	\N
gtvdouj0d4li752suhuhfmfs	nrvc77uqaawbor31e1bx4c9a	qrap87f9nymelsbylq7x1v7w	SKU-qrap87f9nymelsbylq7x1v7w	118	EUR	100	0	\N	t	2025-11-25 14:55:33.021	2025-11-25 14:55:33.021	\N
x537e856r1pahf7bihmszivh	nrvc77uqaawbor31e1bx4c9a	pv1u2qf987xl9l37gxcc6tak	SKU-pv1u2qf987xl9l37gxcc6tak	118	EUR	100	0	\N	t	2025-11-25 14:55:33.664	2025-11-25 14:55:33.664	\N
vcu86hzi142ug9fic4p6z8ao	nrvc77uqaawbor31e1bx4c9a	orea2ez76bfy24tnd3imqiny	SKU-orea2ez76bfy24tnd3imqiny	118	EUR	100	0	\N	t	2025-11-25 14:55:34.299	2025-11-25 14:55:34.299	\N
fstviij4a9hvndnekvhsvnzq	nrvc77uqaawbor31e1bx4c9a	sks3xau4nzkivj2b9hfw6623	SKU-sks3xau4nzkivj2b9hfw6623	118	EUR	100	0	\N	t	2025-11-25 14:55:34.933	2025-11-25 14:55:34.933	\N
n3dq0x70m77obvtmgmqrh3on	nrvc77uqaawbor31e1bx4c9a	i1ihwjyb2hmky2k2eael1ww6	SKU-i1ihwjyb2hmky2k2eael1ww6	118	EUR	100	0	\N	t	2025-11-25 14:55:35.575	2025-11-25 14:55:35.575	\N
iq70rjmjeev2vtgzgig1zrco	nrvc77uqaawbor31e1bx4c9a	yt20lma6xkbqs4y8ts1ijan1	SKU-yt20lma6xkbqs4y8ts1ijan1	118	EUR	100	0	\N	t	2025-11-25 14:55:36.211	2025-11-25 14:55:36.211	\N
zxwm1wqc33hzjht09e8ebrmk	nrvc77uqaawbor31e1bx4c9a	cpmn9hdxzjcg8j8x172okljg	SKU-cpmn9hdxzjcg8j8x172okljg	118	EUR	100	0	\N	t	2025-11-25 14:55:36.848	2025-11-25 14:55:36.848	\N
suu3ila28z9xrpi9lviuomx7	nrvc77uqaawbor31e1bx4c9a	kolpn0bejp9mi99tdw5dczw4	SKU-kolpn0bejp9mi99tdw5dczw4	118	EUR	100	0	\N	t	2025-11-25 14:55:37.481	2025-11-25 14:55:37.481	\N
eqfh5vyh8h0dr02hmv5p4qpw	nrvc77uqaawbor31e1bx4c9a	upzcgu3l31bgb2oqd1innu6p	SKU-upzcgu3l31bgb2oqd1innu6p	118	EUR	100	0	\N	t	2025-11-25 14:55:38.188	2025-11-25 14:55:38.188	\N
e931ofhsvwtx0es9able9ycw	nrvc77uqaawbor31e1bx4c9a	ty6acllb4vra0lb3nx0ilovr	SKU-ty6acllb4vra0lb3nx0ilovr	118	EUR	100	0	\N	t	2025-11-25 14:55:38.822	2025-11-25 14:55:38.822	\N
niw3akil5aauomh951hlvzwl	nrvc77uqaawbor31e1bx4c9a	bwc0esyswxaj96cih0h1yclu	SKU-bwc0esyswxaj96cih0h1yclu	118	EUR	100	0	\N	t	2025-11-25 14:55:39.456	2025-11-25 14:55:39.456	\N
t9c2h4a537aqz7zmph8p8pd6	nrvc77uqaawbor31e1bx4c9a	h66h5euwjwx28abmv8n97aog	SKU-h66h5euwjwx28abmv8n97aog	118	EUR	100	0	\N	t	2025-11-25 14:55:40.087	2025-11-25 14:55:40.087	\N
a0iii2e84kr65hria2xexats	nrvc77uqaawbor31e1bx4c9a	ja21zawlopkcvx9xy348otaa	SKU-ja21zawlopkcvx9xy348otaa	118	EUR	100	0	\N	t	2025-11-25 14:55:40.721	2025-11-25 14:55:40.721	\N
h780hzdxj9u0f2sq8w3cejnr	nrvc77uqaawbor31e1bx4c9a	vaupcyiyta0xdtm46i5xghe1	SKU-vaupcyiyta0xdtm46i5xghe1	118	EUR	100	0	\N	t	2025-11-25 14:55:41.355	2025-11-25 14:55:41.355	\N
kjuv9swdrr1l6bnqvvvtpheq	nrvc77uqaawbor31e1bx4c9a	rt5h0dji2a0nin4u6yai7uv9	SKU-rt5h0dji2a0nin4u6yai7uv9	88	EUR	100	0	\N	t	2025-11-25 14:55:41.987	2025-11-25 14:55:41.987	\N
k4ia8ps2d0p5g166y3csci0c	nrvc77uqaawbor31e1bx4c9a	ijbsw1kvz0dfkh0mzxj2ofl2	SKU-ijbsw1kvz0dfkh0mzxj2ofl2	88	EUR	100	0	\N	t	2025-11-25 14:55:42.622	2025-11-25 14:55:42.622	\N
sefmxn1c04mhumz8s9shkjk7	nrvc77uqaawbor31e1bx4c9a	k3ovse44fxb7oltwyzq2raei	SKU-k3ovse44fxb7oltwyzq2raei	88	EUR	100	0	\N	t	2025-11-25 14:55:43.257	2025-11-25 14:55:43.257	\N
rnw5ndr82muxxx4kv779jf43	nrvc77uqaawbor31e1bx4c9a	ddlpcbacsxs9r9no4nmk1xp8	SKU-ddlpcbacsxs9r9no4nmk1xp8	81	EUR	100	0	\N	t	2025-11-25 14:55:43.897	2025-11-25 14:55:43.897	\N
d5ffgoq7ti2ud2uhl6mw6lsu	nrvc77uqaawbor31e1bx4c9a	eflu1z0ng9expnqe7ojgo2ct	SKU-eflu1z0ng9expnqe7ojgo2ct	116	EUR	100	0	\N	t	2025-11-25 14:55:44.537	2025-11-25 14:55:44.537	\N
vgm5gw41muajbtn4wk4wuozr	nrvc77uqaawbor31e1bx4c9a	g52ijl9sq9873gmz66r8b3l8	SKU-g52ijl9sq9873gmz66r8b3l8	104	EUR	100	0	\N	t	2025-11-25 14:55:45.172	2025-11-25 14:55:45.172	\N
hnu026z3edcdsx9b8ie2ylps	nrvc77uqaawbor31e1bx4c9a	qidfzegv9hpu1tvyhiklm9hw	SKU-qidfzegv9hpu1tvyhiklm9hw	104	EUR	100	0	\N	t	2025-11-25 14:55:45.803	2025-11-25 14:55:45.803	\N
dld354uhetajcqylzohkhj8y	nrvc77uqaawbor31e1bx4c9a	uui23n78kxkfnvdl2nfcrvwz	SKU-uui23n78kxkfnvdl2nfcrvwz	104	EUR	100	0	\N	t	2025-11-25 14:55:46.435	2025-11-25 14:55:46.435	\N
kc7n0jozts7shc04a0ksbjn8	nrvc77uqaawbor31e1bx4c9a	pqoncqelpy3tzb61zh2sg3tx	SKU-pqoncqelpy3tzb61zh2sg3tx	79	EUR	100	0	\N	t	2025-11-25 14:55:47.074	2025-11-25 14:55:47.074	\N
lif4nvc4bmho8nb1utuexf9j	nrvc77uqaawbor31e1bx4c9a	l31kuofq1fouxda895pdk7m1	SKU-l31kuofq1fouxda895pdk7m1	54	EUR	100	0	\N	t	2025-11-25 14:55:47.712	2025-11-25 14:55:47.712	\N
tu2qtksd9goz5nch3x3985ns	nrvc77uqaawbor31e1bx4c9a	ldd636r6sffllu3821u8flsy	SKU-ldd636r6sffllu3821u8flsy	58	EUR	100	0	\N	t	2025-11-25 14:55:48.35	2025-11-25 14:55:48.35	\N
m1q7uxbp358awo5w7idv2cyw	nrvc77uqaawbor31e1bx4c9a	gmc1kb0rgvwb7fp178zx70ll	SKU-gmc1kb0rgvwb7fp178zx70ll	63	EUR	100	0	\N	t	2025-11-25 14:55:48.983	2025-11-25 14:55:48.983	\N
bdcwx9a24eivoysoqbf5c2j5	nrvc77uqaawbor31e1bx4c9a	kjxvinl4hbcx4udmdfwdoy2y	SKU-kjxvinl4hbcx4udmdfwdoy2y	63	EUR	100	0	\N	t	2025-11-25 14:55:49.623	2025-11-25 14:55:49.623	\N
uohne0jta6tm3uwepku9x6ul	nrvc77uqaawbor31e1bx4c9a	ljn2yl7by5dn02fyx96sm0xn	SKU-ljn2yl7by5dn02fyx96sm0xn	63	EUR	100	0	\N	t	2025-11-25 14:55:50.253	2025-11-25 14:55:50.253	\N
gtt620w5b68vfib407lknrij	nrvc77uqaawbor31e1bx4c9a	vpko5vh7rgtyi1s2wutoxpfk	SKU-vpko5vh7rgtyi1s2wutoxpfk	63	EUR	100	0	\N	t	2025-11-25 14:55:50.886	2025-11-25 14:55:50.886	\N
gnu08fgrgxdk7gloruv9d5pg	nrvc77uqaawbor31e1bx4c9a	empulo7wwktq0ufosc56y941	SKU-empulo7wwktq0ufosc56y941	62	EUR	100	0	\N	t	2025-11-25 14:55:51.524	2025-11-25 14:55:51.524	\N
fpplbbl2jy2mh8m2vwzyjdb0	nrvc77uqaawbor31e1bx4c9a	k7b7aju4bfmov5d7aus66hjl	SKU-k7b7aju4bfmov5d7aus66hjl	153	EUR	100	0	\N	t	2025-11-25 14:55:52.161	2025-11-25 14:55:52.161	\N
iqpllb0lvaubmp13w9fyqseg	nrvc77uqaawbor31e1bx4c9a	fx5ijtywhtne0l9hj5uze1k7	SKU-fx5ijtywhtne0l9hj5uze1k7	153	EUR	100	0	\N	t	2025-11-25 14:55:52.795	2025-11-25 14:55:52.795	\N
wnwkycup0xjzyk0ylhjgjc8s	nrvc77uqaawbor31e1bx4c9a	psu1m67rs8andhg4oocfhx3a	SKU-psu1m67rs8andhg4oocfhx3a	153	EUR	100	0	\N	t	2025-11-25 14:55:53.56	2025-11-25 14:55:53.56	\N
bdssxc95rmex4aqqaimoz9vy	nrvc77uqaawbor31e1bx4c9a	z2fo8mzendws1b8vtt4n2xni	SKU-z2fo8mzendws1b8vtt4n2xni	62	EUR	100	0	\N	t	2025-11-25 14:55:54.19	2025-11-25 14:55:54.19	\N
hx1p2m369l21up53i7m2zp9i	nrvc77uqaawbor31e1bx4c9a	zhadcg1a9vc93an7jnkbomz9	SKU-zhadcg1a9vc93an7jnkbomz9	53	EUR	100	0	\N	t	2025-11-25 14:55:54.835	2025-11-25 14:55:54.835	\N
dfp9amk4c350j3fe1egl1vsg	nrvc77uqaawbor31e1bx4c9a	m2six3un8w57txyxc2ti2l7e	SKU-m2six3un8w57txyxc2ti2l7e	63	EUR	100	0	\N	t	2025-11-25 14:55:55.467	2025-11-25 14:55:55.467	\N
dlnf4d0kbphusxams3xd78jl	nrvc77uqaawbor31e1bx4c9a	h5ndiwvimhgj4u2w5iapzm2j	SKU-h5ndiwvimhgj4u2w5iapzm2j	73	EUR	100	0	\N	t	2025-11-25 14:55:56.104	2025-11-25 14:55:56.104	\N
zuylswnsh6i40uz87hmxjp4h	nrvc77uqaawbor31e1bx4c9a	xp2nb5zkv8dd9o34xtrb5kbf	SKU-xp2nb5zkv8dd9o34xtrb5kbf	73	EUR	100	0	\N	t	2025-11-25 14:55:56.734	2025-11-25 14:55:56.734	\N
d391rurd4yp78v5ljw2crbec	nrvc77uqaawbor31e1bx4c9a	xjibwvuyongv7r68dfl3428j	SKU-xjibwvuyongv7r68dfl3428j	50	EUR	100	0	\N	t	2025-11-25 14:55:57.367	2025-11-25 14:55:57.367	\N
jo4p159ok6j3bz42trn7cbz2	nrvc77uqaawbor31e1bx4c9a	i8yo01nnwtnuuf7bmckttdxh	SKU-i8yo01nnwtnuuf7bmckttdxh	50	EUR	100	0	\N	t	2025-11-25 14:55:58.004	2025-11-25 14:55:58.004	\N
eimh3vd24bpq7fcxyp9bppsz	nrvc77uqaawbor31e1bx4c9a	uw1lb9syxgtungc75qhndbjw	SKU-uw1lb9syxgtungc75qhndbjw	68	EUR	100	0	\N	t	2025-11-25 14:55:58.634	2025-11-25 14:55:58.634	\N
i7h3wkkze3rnku3b5qay87au	nrvc77uqaawbor31e1bx4c9a	mm4ja4qocpb1e0sxagnqdol6	SKU-mm4ja4qocpb1e0sxagnqdol6	103	EUR	100	0	\N	t	2025-11-25 14:55:59.266	2025-11-25 14:55:59.266	\N
ds7nn9h99abkf9texmnol7ot	nrvc77uqaawbor31e1bx4c9a	ish6b6roxoejqr0vgdnjve4z	SKU-ish6b6roxoejqr0vgdnjve4z	103	EUR	100	0	\N	t	2025-11-25 14:55:59.907	2025-11-25 14:55:59.907	\N
d6uvendcjfnz0xqx3rjl60yi	nrvc77uqaawbor31e1bx4c9a	k8kfk6yuf0g2ahdmhzcy4nu7	SKU-k8kfk6yuf0g2ahdmhzcy4nu7	103	EUR	100	0	\N	t	2025-11-25 14:56:00.54	2025-11-25 14:56:00.54	\N
bjudpg2ocu8q0n46ivzm8q1l	nrvc77uqaawbor31e1bx4c9a	sklsq1n2hunj38d7bjxfg4gs	SKU-sklsq1n2hunj38d7bjxfg4gs	103	EUR	100	0	\N	t	2025-11-25 14:56:01.173	2025-11-25 14:56:01.173	\N
fni7nd5yopdvjwct3evo7hnd	nrvc77uqaawbor31e1bx4c9a	etnhzgjvx3rpp8w50zdip89p	SKU-etnhzgjvx3rpp8w50zdip89p	96	EUR	100	0	\N	t	2025-11-25 14:56:01.812	2025-11-25 14:56:01.812	\N
gxmby2l4xup3fwilmy3loiw3	nrvc77uqaawbor31e1bx4c9a	cbbiqwvxo8c5gno9h4qbayvr	SKU-cbbiqwvxo8c5gno9h4qbayvr	96	EUR	100	0	\N	t	2025-11-25 14:56:02.445	2025-11-25 14:56:02.445	\N
uulzk24ykeqmge3oz6s3plbj	nrvc77uqaawbor31e1bx4c9a	ndkz2g5qu0inkwckbquaghiz	SKU-ndkz2g5qu0inkwckbquaghiz	96	EUR	100	0	\N	t	2025-11-25 14:56:03.087	2025-11-25 14:56:03.087	\N
h5efnfpu54158yonuk9lti3o	nrvc77uqaawbor31e1bx4c9a	nadwznmocw9kkqqckfz0m74i	SKU-nadwznmocw9kkqqckfz0m74i	96	EUR	100	0	\N	t	2025-11-25 14:56:03.721	2025-11-25 14:56:03.721	\N
o8gtqppho8c707aomdi95rvk	nrvc77uqaawbor31e1bx4c9a	mpsqiz3b9qztv40of7vmsri6	SKU-mpsqiz3b9qztv40of7vmsri6	96	EUR	100	0	\N	t	2025-11-25 14:56:04.357	2025-11-25 14:56:04.357	\N
tvrevqu0nv8g9tqcui1kiyib	nrvc77uqaawbor31e1bx4c9a	b3o59ew3o42epqix4eu6vwjb	SKU-b3o59ew3o42epqix4eu6vwjb	103	EUR	100	0	\N	t	2025-11-25 14:56:04.991	2025-11-25 14:56:04.991	\N
k39km39gko1361he04bxkwfk	nrvc77uqaawbor31e1bx4c9a	bkp846h7tqlnd5w1k5rxg0ov	SKU-bkp846h7tqlnd5w1k5rxg0ov	87	EUR	100	0	\N	t	2025-11-25 14:56:05.625	2025-11-25 14:56:05.625	\N
zvj0v9ggaorvknrggypff605	nrvc77uqaawbor31e1bx4c9a	q4glazdmkvrt3zgrw61vjoem	SKU-q4glazdmkvrt3zgrw61vjoem	659	EUR	100	0	\N	t	2025-11-25 15:07:24.313	2025-11-25 15:07:24.313	\N
pytvt60ubeh921c6pjtwpanv	nrvc77uqaawbor31e1bx4c9a	l3xnsdql4wwjsh5x0fvb8ngy	SKU-l3xnsdql4wwjsh5x0fvb8ngy	1190	EUR	100	0	\N	t	2025-11-25 15:07:24.944	2025-11-25 15:07:24.944	\N
evyrxf8g9tpuasm2o2rpwqlp	nrvc77uqaawbor31e1bx4c9a	cswo0v6lnyg7399berbv8tbj	SKU-cswo0v6lnyg7399berbv8tbj	1105	EUR	100	0	\N	t	2025-11-25 15:07:25.578	2025-11-25 15:07:25.578	\N
r6roxtqu0gztaunowzepj8fd	nrvc77uqaawbor31e1bx4c9a	wgecd9shaiez4kaaa3tc1dox	SKU-wgecd9shaiez4kaaa3tc1dox	843	EUR	100	0	\N	t	2025-11-25 15:07:26.213	2025-11-25 15:07:26.213	\N
qq632zy19sifz0ism8w1t388	nrvc77uqaawbor31e1bx4c9a	tms5oc2px4fesye5ka8fv4y2	SKU-tms5oc2px4fesye5ka8fv4y2	999	EUR	100	0	\N	t	2025-11-25 15:07:26.917	2025-11-25 15:07:26.917	\N
uwwo3wpn2vlxngkmody113hd	nrvc77uqaawbor31e1bx4c9a	fgxwbykk7phrznp9gxkdgaso	SKU-fgxwbykk7phrznp9gxkdgaso	564	EUR	100	0	\N	t	2025-11-25 15:07:27.552	2025-11-25 15:07:27.552	\N
gh5defx7uplx8uxdqb24ictl	nrvc77uqaawbor31e1bx4c9a	zyasrv34lvzubkm52vilee4i	SKU-zyasrv34lvzubkm52vilee4i	1063	EUR	100	0	\N	t	2025-11-25 15:07:28.183	2025-11-25 15:07:28.183	\N
lj9k16c61pbscoa0j3iv9s13	nrvc77uqaawbor31e1bx4c9a	p7ypahxm2xgrnqqf1evolw1r	SKU-p7ypahxm2xgrnqqf1evolw1r	740	EUR	100	0	\N	t	2025-11-25 15:07:28.816	2025-11-25 15:07:28.816	\N
loyvtl3929siplg0oxyelfla	nrvc77uqaawbor31e1bx4c9a	p3ph4z8kemh1psi8oto81czp	SKU-p3ph4z8kemh1psi8oto81czp	609	EUR	100	0	\N	t	2025-11-25 15:07:29.451	2025-11-25 15:07:29.451	\N
x5z8xivrxuwswaawgkk3ddav	nrvc77uqaawbor31e1bx4c9a	zss2zfo05ndq94ror7mpqvz7	SKU-zss2zfo05ndq94ror7mpqvz7	453	EUR	100	0	\N	t	2025-11-25 15:07:30.082	2025-11-25 15:07:30.082	\N
nzm9if9smgbtug1yjn8zv8cb	nrvc77uqaawbor31e1bx4c9a	bc6z2hkft1i2nz55vnz1rbo4	SKU-bc6z2hkft1i2nz55vnz1rbo4	533	EUR	100	0	\N	t	2025-11-25 15:07:30.715	2025-11-25 15:07:30.715	\N
h9i0bixf2r8r4ys2is1uaz5w	nrvc77uqaawbor31e1bx4c9a	lpzr0k0cg2yqitanstnml4uu	SKU-lpzr0k0cg2yqitanstnml4uu	1590	EUR	100	0	\N	t	2025-11-25 15:07:31.455	2025-11-25 15:07:31.455	\N
zis0yyvmlfzkm29mtzb2zlbv	nrvc77uqaawbor31e1bx4c9a	j6hpjs92jkej1q4i34wfg5k0	SKU-j6hpjs92jkej1q4i34wfg5k0	1072	EUR	100	0	\N	t	2025-11-25 15:07:32.08	2025-11-25 15:07:32.08	\N
mnefhoem27cupozjowpbx6z0	nrvc77uqaawbor31e1bx4c9a	wm63n4dcul64n23vflthd2va	SKU-wm63n4dcul64n23vflthd2va	1054	EUR	100	0	\N	t	2025-11-25 15:07:32.713	2025-11-25 15:07:32.713	\N
b4kztw4h475jbnwg36soc20b	nrvc77uqaawbor31e1bx4c9a	bchp06s6dy98qavdca2n52sp	SKU-bchp06s6dy98qavdca2n52sp	662	EUR	100	0	\N	t	2025-11-25 15:07:33.343	2025-11-25 15:07:33.343	\N
v8bkz5l5qnltoqo789epg9uh	nrvc77uqaawbor31e1bx4c9a	q91hvac0hhdfvedlorrygbw3	SKU-q91hvac0hhdfvedlorrygbw3	987	EUR	100	0	\N	t	2025-11-25 15:07:33.978	2025-11-25 15:07:33.978	\N
acm37llw9dhp9y2w94741p9z	nrvc77uqaawbor31e1bx4c9a	h573px0t8lqs07d29j0t8gz6	SKU-h573px0t8lqs07d29j0t8gz6	1148	EUR	100	0	\N	t	2025-11-25 15:07:34.611	2025-11-25 15:07:34.611	\N
sp2pii4wzz0j8e0w8osrval0	nrvc77uqaawbor31e1bx4c9a	s3apaykdunqjos5f3fnf9gao	SKU-s3apaykdunqjos5f3fnf9gao	3451	EUR	100	0	\N	t	2025-11-25 15:07:35.244	2025-11-25 15:07:35.244	\N
myz85slmjqfrv86m82698tne	nrvc77uqaawbor31e1bx4c9a	lq47fmeodzry20s1di1ilnko	SKU-lq47fmeodzry20s1di1ilnko	460	EUR	100	0	\N	t	2025-11-25 15:07:35.875	2025-11-25 15:07:35.875	\N
veen2m8odoe5beha3r7e91g5	nrvc77uqaawbor31e1bx4c9a	e3lxwdt6am08m4d71b772inu	SKU-e3lxwdt6am08m4d71b772inu	10540	EUR	100	0	\N	t	2025-11-25 15:07:36.537	2025-11-25 15:07:36.537	\N
v9uyg1ufg8j1urx873ngnyni	nrvc77uqaawbor31e1bx4c9a	xo8y5hrhezbd3nco8lscqpbq	SKU-xo8y5hrhezbd3nco8lscqpbq	12538	EUR	100	0	\N	t	2025-11-25 15:07:37.165	2025-11-25 15:07:37.165	\N
z1qj6jsn74nkio144jhxb2m1	nrvc77uqaawbor31e1bx4c9a	wisyx4ze7cbusfw0bg0jfkn2	SKU-wisyx4ze7cbusfw0bg0jfkn2	1122	EUR	100	0	\N	t	2025-11-25 15:07:37.803	2025-11-25 15:07:37.803	\N
eb9xrrtkdkci5mo2duzdihnj	nrvc77uqaawbor31e1bx4c9a	tqoj0t7ke0qinugkayfqlq8j	SKU-tqoj0t7ke0qinugkayfqlq8j	945	EUR	100	0	\N	t	2025-11-25 15:07:38.431	2025-11-25 15:07:38.431	\N
hjy6u7nyd939b127d9cw9ov4	nrvc77uqaawbor31e1bx4c9a	a374cf9ntzhqqcbth99xaa2r	SKU-a374cf9ntzhqqcbth99xaa2r	1445	EUR	100	0	\N	t	2025-11-25 15:07:39.067	2025-11-25 15:07:39.067	\N
p8anfk1z6521goul6fdqo3oa	nrvc77uqaawbor31e1bx4c9a	kav0zehpu1vnr55wfkljdhbf	SKU-kav0zehpu1vnr55wfkljdhbf	949	EUR	100	0	\N	t	2025-11-25 15:07:39.699	2025-11-25 15:07:39.699	\N
nvqlm8dnlwirkd1la6l8apfp	nrvc77uqaawbor31e1bx4c9a	sc24w06k2zxdydi2ok9r09s4	SKU-sc24w06k2zxdydi2ok9r09s4	779	EUR	100	0	\N	t	2025-11-25 15:07:40.335	2025-11-25 15:07:40.335	\N
bwq8ddwhvri4qj1ojrch580d	nrvc77uqaawbor31e1bx4c9a	vhx8fq9xpl3vgoowg28vw7e8	SKU-vhx8fq9xpl3vgoowg28vw7e8	672	EUR	100	0	\N	t	2025-11-25 15:07:40.965	2025-11-25 15:07:40.965	\N
npvgsxlykxz91h0it73ion6m	nrvc77uqaawbor31e1bx4c9a	d9htmzaf7uytbjr9xx2gc1pq	SKU-d9htmzaf7uytbjr9xx2gc1pq	1658	EUR	100	0	\N	t	2025-11-25 15:07:41.599	2025-11-25 15:07:41.599	\N
cahflg5gva8tzcvgq8vi1yt8	nrvc77uqaawbor31e1bx4c9a	uofgovta8tgukc6euat2j860	SKU-uofgovta8tgukc6euat2j860	779	EUR	100	0	\N	t	2025-11-25 15:07:42.304	2025-11-25 15:07:42.304	\N
r26yqg60sbc6y3furdt8tkc7	nrvc77uqaawbor31e1bx4c9a	eaowvo87f1g8y5wvtu31qhlm	SKU-eaowvo87f1g8y5wvtu31qhlm	538	EUR	100	0	\N	t	2025-11-25 15:07:42.935	2025-11-25 15:07:42.935	\N
p3pzqejj627483yh1jo1dmt9	nrvc77uqaawbor31e1bx4c9a	sd4ff1233y3vrt6500cy0e9y	SKU-sd4ff1233y3vrt6500cy0e9y	4505	EUR	100	0	\N	t	2025-11-25 15:07:43.565	2025-11-25 15:07:43.565	\N
stp8hrddngz294yb3z3gvczr	nrvc77uqaawbor31e1bx4c9a	s70wns2bormuvxqj9b8btlpv	SKU-s70wns2bormuvxqj9b8btlpv	1275	EUR	100	0	\N	t	2025-11-25 15:07:44.199	2025-11-25 15:07:44.199	\N
ur2s2duitd3r0mkd2ntnwz9z	nrvc77uqaawbor31e1bx4c9a	b49rhgl7wxiibxbllmil48ge	SKU-b49rhgl7wxiibxbllmil48ge	772	EUR	100	0	\N	t	2025-11-25 15:07:44.834	2025-11-25 15:07:44.834	\N
f3ygtpw8s8en3fly9frdudoq	nrvc77uqaawbor31e1bx4c9a	j55oo42xz8wr46e46jbikdlz	SKU-j55oo42xz8wr46e46jbikdlz	504	EUR	100	0	\N	t	2025-11-25 15:07:45.47	2025-11-25 15:07:45.47	\N
cht1mte6r48cdhafudthvr1b	nrvc77uqaawbor31e1bx4c9a	tc7lo1ujnt3vnpinksrnmdl3	SKU-tc7lo1ujnt3vnpinksrnmdl3	839	EUR	100	0	\N	t	2025-11-25 15:07:46.124	2025-11-25 15:07:46.124	\N
j0rottxfelbj9phiwj556f7d	nrvc77uqaawbor31e1bx4c9a	cr8coump0za408gn8cg7namq	SKU-cr8coump0za408gn8cg7namq	347	EUR	100	0	\N	t	2025-11-25 15:07:46.754	2025-11-25 15:07:46.754	\N
m4707fmvototcx6vqjp602hu	nrvc77uqaawbor31e1bx4c9a	dhyjj46ft4iztmzo8v9p14ju	SKU-dhyjj46ft4iztmzo8v9p14ju	4531	EUR	100	0	\N	t	2025-11-25 15:07:47.389	2025-11-25 15:07:47.389	\N
rau1pselvtkoqcn9o7meyurf	nrvc77uqaawbor31e1bx4c9a	otbwp333gj385o2hazyitf1r	SKU-otbwp333gj385o2hazyitf1r	425	EUR	100	0	\N	t	2025-11-25 15:07:48.028	2025-11-25 15:07:48.028	\N
wp88gwx5aeonvu7rtpzz7fya	nrvc77uqaawbor31e1bx4c9a	tk8cf7z8ywkdmu63ts6l9g23	SKU-tk8cf7z8ywkdmu63ts6l9g23	843	EUR	100	0	\N	t	2025-11-25 15:07:48.663	2025-11-25 15:07:48.663	\N
b052irs8evhc006nohwy6cgs	nrvc77uqaawbor31e1bx4c9a	x3dk6i78i9nckvkcdz0qezqj	SKU-x3dk6i78i9nckvkcdz0qezqj	672	EUR	100	0	\N	t	2025-11-25 15:07:49.3	2025-11-25 15:07:49.3	\N
qisuy2d1l75ec3xs13bxik3o	nrvc77uqaawbor31e1bx4c9a	g0vc349mbynisghcqcqs2fc5	SKU-g0vc349mbynisghcqcqs2fc5	1700	EUR	100	0	\N	t	2025-11-25 15:07:49.932	2025-11-25 15:07:49.932	\N
l3oid0t22vl1iqawzmgh4uqi	nrvc77uqaawbor31e1bx4c9a	l62owxkzeg3b473k1h93sd3h	SKU-l62owxkzeg3b473k1h93sd3h	87	EUR	100	0	\N	t	2025-11-25 14:56:06.258	2025-11-25 14:56:06.258	\N
f1h2a6o04xj1zswsls9j33ir	nrvc77uqaawbor31e1bx4c9a	doik6p5zwi3u19py3usigevg	SKU-doik6p5zwi3u19py3usigevg	87	EUR	100	0	\N	t	2025-11-25 14:56:06.896	2025-11-25 14:56:06.896	\N
odt5xl0vnwwc01w2ubbkuzyx	nrvc77uqaawbor31e1bx4c9a	nuf5v2apf5d684pu6g2cex0m	SKU-nuf5v2apf5d684pu6g2cex0m	43	EUR	100	0	\N	t	2025-11-25 14:56:07.534	2025-11-25 14:56:07.534	\N
smjvhe3btpv0w89n0dwy61y6	nrvc77uqaawbor31e1bx4c9a	u1nkvquljlt97n2mqvy7urd5	SKU-u1nkvquljlt97n2mqvy7urd5	43	EUR	100	0	\N	t	2025-11-25 14:56:08.171	2025-11-25 14:56:08.171	\N
c6g81owrwyvgeo8251b7pnm7	nrvc77uqaawbor31e1bx4c9a	j6ua2mp70f7d1vuhka3p8fce	SKU-j6ua2mp70f7d1vuhka3p8fce	50	EUR	100	0	\N	t	2025-11-25 14:56:08.88	2025-11-25 14:56:08.88	\N
ygcndhcff7a9pbap2s47rn1i	nrvc77uqaawbor31e1bx4c9a	v1mmohnpewo634n1fvptgbga	SKU-v1mmohnpewo634n1fvptgbga	155	EUR	100	0	\N	t	2025-11-25 14:56:09.511	2025-11-25 14:56:09.511	\N
w0x6mt5hswbrfvm4fcqscuwa	nrvc77uqaawbor31e1bx4c9a	df3epfchgjl79lwerafkjhuk	SKU-df3epfchgjl79lwerafkjhuk	151	EUR	100	0	\N	t	2025-11-25 14:56:10.152	2025-11-25 14:56:10.152	\N
b8jip8m525okciz13kuon9vo	nrvc77uqaawbor31e1bx4c9a	m4co299iwex7ee4l2903kek4	SKU-m4co299iwex7ee4l2903kek4	151	EUR	100	0	\N	t	2025-11-25 14:56:10.783	2025-11-25 14:56:10.783	\N
u0wn5dbzvw507oinxcry2fj6	nrvc77uqaawbor31e1bx4c9a	ar869ldeu6tmlupvouk7utpb	SKU-ar869ldeu6tmlupvouk7utpb	128	EUR	100	0	\N	t	2025-11-25 14:56:11.417	2025-11-25 14:56:11.417	\N
e49ds1yfocsyayuqsu4e09cd	nrvc77uqaawbor31e1bx4c9a	jww4x3ixlhvj4rh7g994lmeh	SKU-jww4x3ixlhvj4rh7g994lmeh	128	EUR	100	0	\N	t	2025-11-25 14:56:12.052	2025-11-25 14:56:12.052	\N
yzmtlfy38dw6uvyxrz81tp12	nrvc77uqaawbor31e1bx4c9a	jubakti1c9iqh3i2j3kjdw8l	SKU-jubakti1c9iqh3i2j3kjdw8l	128	EUR	100	0	\N	t	2025-11-25 14:56:12.687	2025-11-25 14:56:12.687	\N
zp2zka5slkrz86ckvgvj1pgt	nrvc77uqaawbor31e1bx4c9a	ewvvy1zocqudgsteew582fxy	SKU-ewvvy1zocqudgsteew582fxy	199	EUR	100	0	\N	t	2025-11-25 14:56:13.32	2025-11-25 14:56:13.32	\N
shapfk7a89vnqrdjxb5n4y9k	nrvc77uqaawbor31e1bx4c9a	jkmj2c4w7ivsplmucfi3ue2v	SKU-jkmj2c4w7ivsplmucfi3ue2v	200	EUR	100	0	\N	t	2025-11-25 14:56:13.955	2025-11-25 14:56:13.955	\N
itm6pndnzds8yo6itnsntjn6	nrvc77uqaawbor31e1bx4c9a	rr02e28ua180b0oqjctzzn2g	SKU-rr02e28ua180b0oqjctzzn2g	163	EUR	100	0	\N	t	2025-11-25 14:56:14.603	2025-11-25 14:56:14.603	\N
yaqu6vyemjxao60qg2l2d9jd	nrvc77uqaawbor31e1bx4c9a	w98hdju6krw4zq6xe96rchit	SKU-w98hdju6krw4zq6xe96rchit	465	EUR	100	0	\N	t	2025-11-25 14:56:15.241	2025-11-25 14:56:15.241	\N
pqoyq9308a1f33nbeb84lew9	nrvc77uqaawbor31e1bx4c9a	iz40zi8wcnmzzbx4efyostd7	SKU-iz40zi8wcnmzzbx4efyostd7	163	EUR	100	0	\N	t	2025-11-25 14:56:15.878	2025-11-25 14:56:15.878	\N
xu3vk8njzwqz5bekod3m6fey	nrvc77uqaawbor31e1bx4c9a	eaynxodx6puamop3ujv87dhh	SKU-eaynxodx6puamop3ujv87dhh	85	EUR	100	0	\N	t	2025-11-25 14:56:16.511	2025-11-25 14:56:16.511	\N
ogyonvbauo595iv34aysv09u	nrvc77uqaawbor31e1bx4c9a	xbjb3ciktmtyhypr08npkqv4	SKU-xbjb3ciktmtyhypr08npkqv4	85	EUR	100	0	\N	t	2025-11-25 14:56:17.148	2025-11-25 14:56:17.148	\N
qzi02bdqy0rqpm0q2zbnkbvc	nrvc77uqaawbor31e1bx4c9a	xtexehgnx36pq03goxyhfujc	SKU-xtexehgnx36pq03goxyhfujc	3825	EUR	100	0	\N	t	2025-11-25 14:56:17.779	2025-11-25 14:56:17.779	\N
dw3hp65vtzhw330mti1tg823	nrvc77uqaawbor31e1bx4c9a	j7fa42x0a6v0258tsxdvt9xw	SKU-j7fa42x0a6v0258tsxdvt9xw	3825	EUR	100	0	\N	t	2025-11-25 14:56:18.412	2025-11-25 14:56:18.412	\N
fsrtoxgixbpc3srf1dgbayce	nrvc77uqaawbor31e1bx4c9a	uyfunahqkdp3fcbgg41oh5sz	SKU-uyfunahqkdp3fcbgg41oh5sz	18600	EUR	100	0	\N	t	2025-11-25 14:56:19.051	2025-11-25 14:56:19.051	\N
ud0v9xzzlm7vc5sz9l4ixnd6	nrvc77uqaawbor31e1bx4c9a	zu7xnjb1iqb9o50qv1ac1llv	SKU-zu7xnjb1iqb9o50qv1ac1llv	19050	EUR	100	0	\N	t	2025-11-25 14:56:19.686	2025-11-25 14:56:19.686	\N
xs2omdamlsahf89crtwdxgua	nrvc77uqaawbor31e1bx4c9a	yqpli3flw1ugc2pj95r5dmc4	SKU-yqpli3flw1ugc2pj95r5dmc4	19050	EUR	100	0	\N	t	2025-11-25 14:56:20.322	2025-11-25 14:56:20.322	\N
vucb5qvu7b6526wqysvoj0et	nrvc77uqaawbor31e1bx4c9a	f5bkfdxjmjdkna2jinddj23o	SKU-f5bkfdxjmjdkna2jinddj23o	3000	EUR	100	0	\N	t	2025-11-25 14:56:20.951	2025-11-25 14:56:20.951	\N
knxtyp7o1yb2zwpdbbryh3br	nrvc77uqaawbor31e1bx4c9a	uz14dt36gcm95ehub3lygnz0	SKU-uz14dt36gcm95ehub3lygnz0	2925	EUR	100	0	\N	t	2025-11-25 14:56:21.591	2025-11-25 14:56:21.591	\N
zcnoclo2tknb3ct892q8fzpz	nrvc77uqaawbor31e1bx4c9a	ipr5qj9smrxiz7yjmpsjbzm0	SKU-ipr5qj9smrxiz7yjmpsjbzm0	3000	EUR	100	0	\N	t	2025-11-25 14:56:22.231	2025-11-25 14:56:22.231	\N
iwo5qog0gfdtjlmrg10hc7ve	nrvc77uqaawbor31e1bx4c9a	v46txgyym4f2kyrvzohf7uta	SKU-v46txgyym4f2kyrvzohf7uta	5325	EUR	100	0	\N	t	2025-11-25 14:56:22.862	2025-11-25 14:56:22.862	\N
yiiovp7yfksrsbi20soythn0	nrvc77uqaawbor31e1bx4c9a	ao9duvicyxu5qrssokvjy601	SKU-ao9duvicyxu5qrssokvjy601	5325	EUR	100	0	\N	t	2025-11-25 14:56:23.495	2025-11-25 14:56:23.495	\N
phtdc2dcj939d88zptnmv4rk	nrvc77uqaawbor31e1bx4c9a	kw7nsbnbxzdecsjgguvmcht6	SKU-kw7nsbnbxzdecsjgguvmcht6	5325	EUR	100	0	\N	t	2025-11-25 14:56:24.202	2025-11-25 14:56:24.202	\N
dm9psffval7ea45nml9imuw4	nrvc77uqaawbor31e1bx4c9a	qzo8is9k6igtgkk4io923na4	SKU-qzo8is9k6igtgkk4io923na4	3600	EUR	100	0	\N	t	2025-11-25 14:56:24.834	2025-11-25 14:56:24.834	\N
zkuzwd2k8elfad5t7bjdzzib	nrvc77uqaawbor31e1bx4c9a	lj8sov32bsnlm738lx53jci6	SKU-lj8sov32bsnlm738lx53jci6	5243	EUR	100	0	\N	t	2025-11-25 14:56:25.489	2025-11-25 14:56:25.489	\N
g75fzccc4xv0l00uupefjt9m	nrvc77uqaawbor31e1bx4c9a	mdq9csx5e2jbvs1fp1mv4b9n	SKU-mdq9csx5e2jbvs1fp1mv4b9n	5925	EUR	100	0	\N	t	2025-11-25 14:56:26.127	2025-11-25 14:56:26.127	\N
b11b6lmqxpfig12g8ft42l3w	nrvc77uqaawbor31e1bx4c9a	vx9sj1ahuc4m48hmhpouvgot	SKU-vx9sj1ahuc4m48hmhpouvgot	5775	EUR	100	0	\N	t	2025-11-25 14:56:26.767	2025-11-25 14:56:26.767	\N
pmjexso8qhpxplhfvrt3awmi	nrvc77uqaawbor31e1bx4c9a	h97n2nisjdycylsk8aprhmkh	SKU-h97n2nisjdycylsk8aprhmkh	5175	EUR	100	0	\N	t	2025-11-25 14:56:27.399	2025-11-25 14:56:27.399	\N
ouckj0eg9an0xb2pty0wvdiy	nrvc77uqaawbor31e1bx4c9a	pzbpr3hcwjksddrnbdtmsulm	SKU-pzbpr3hcwjksddrnbdtmsulm	4125	EUR	100	0	\N	t	2025-11-25 14:56:28.029	2025-11-25 14:56:28.029	\N
yx91d9elnodb9q2ef6kl4r8k	nrvc77uqaawbor31e1bx4c9a	x4xenqffwop21hszoz52s4tl	SKU-x4xenqffwop21hszoz52s4tl	6600	EUR	100	0	\N	t	2025-11-25 14:56:28.661	2025-11-25 14:56:28.661	\N
zxxcjzvc48ty8iikw5f66ltl	nrvc77uqaawbor31e1bx4c9a	m3he4r0teocvq71ydxt7zwua	SKU-m3he4r0teocvq71ydxt7zwua	6000	EUR	100	0	\N	t	2025-11-25 14:56:29.292	2025-11-25 14:56:29.292	\N
vkzl1uu3v99ypqsujzuwe3pi	nrvc77uqaawbor31e1bx4c9a	j1nl4nju1llgstgu4l1rjaqq	SKU-j1nl4nju1llgstgu4l1rjaqq	6570	EUR	100	0	\N	t	2025-11-25 14:56:29.934	2025-11-25 14:56:29.934	\N
io6wztund263vvjmdzjmq6px	nrvc77uqaawbor31e1bx4c9a	ghufgqz5a9j6xwqkgljiv45f	SKU-ghufgqz5a9j6xwqkgljiv45f	6750	EUR	100	0	\N	t	2025-11-25 14:56:30.565	2025-11-25 14:56:30.565	\N
d4r9nnpiz2hm1v27gszwzuex	nrvc77uqaawbor31e1bx4c9a	fzurglnnke5e54b1i437q5nh	SKU-fzurglnnke5e54b1i437q5nh	6825	EUR	100	0	\N	t	2025-11-25 14:56:31.21	2025-11-25 14:56:31.21	\N
y6zkf2e7kwevq5hhbcruc8zj	nrvc77uqaawbor31e1bx4c9a	ulavm7vqrxnut6s6a8dghbzg	SKU-ulavm7vqrxnut6s6a8dghbzg	6840	EUR	100	0	\N	t	2025-11-25 14:56:31.842	2025-11-25 14:56:31.842	\N
r9cnn2jzcppwov3s8vb8l5g2	nrvc77uqaawbor31e1bx4c9a	rqwqldh46otu3ook5ybdwubz	SKU-rqwqldh46otu3ook5ybdwubz	5250	EUR	100	0	\N	t	2025-11-25 14:56:32.483	2025-11-25 14:56:32.483	\N
y7jez0ce9erdq61vkaxukfzx	nrvc77uqaawbor31e1bx4c9a	rbptf091px4pvb2kd68r83jd	SKU-rbptf091px4pvb2kd68r83jd	3338	EUR	100	0	\N	t	2025-11-25 14:56:33.114	2025-11-25 14:56:33.114	\N
vh14aku6fegnbzwbxo8lgpl7	nrvc77uqaawbor31e1bx4c9a	yntctrxdj2shawz2rk7vrk80	SKU-yntctrxdj2shawz2rk7vrk80	12375	EUR	100	0	\N	t	2025-11-25 14:56:33.75	2025-11-25 14:56:33.75	\N
isdxocyii1tx5lux4y54oxrs	nrvc77uqaawbor31e1bx4c9a	z8o6ye2js13csm9oqt8nk929	SKU-z8o6ye2js13csm9oqt8nk929	9000	EUR	100	0	\N	t	2025-11-25 14:56:34.384	2025-11-25 14:56:34.384	\N
hmbounj54vj2fhhaau9lvd38	nrvc77uqaawbor31e1bx4c9a	zzzmldtvqfxn5do9zi9xdphw	SKU-zzzmldtvqfxn5do9zi9xdphw	9750	EUR	100	0	\N	t	2025-11-25 14:56:35.018	2025-11-25 14:56:35.018	\N
y6bmzj63k8437akmktxwzopx	nrvc77uqaawbor31e1bx4c9a	izvhuk5j8s3r6lv3vh56wz2m	SKU-izvhuk5j8s3r6lv3vh56wz2m	8100	EUR	100	0	\N	t	2025-11-25 14:56:35.656	2025-11-25 14:56:35.656	\N
tx1u3c8fl113f96wiv3hjzn7	nrvc77uqaawbor31e1bx4c9a	o0y4zt5pbmqr5d5bk2g6prff	SKU-o0y4zt5pbmqr5d5bk2g6prff	9225	EUR	100	0	\N	t	2025-11-25 14:56:36.29	2025-11-25 14:56:36.29	\N
ha2f9ilqhgl1rktq80zahy1j	nrvc77uqaawbor31e1bx4c9a	i828kn9h67x5vz1nsk2qvnro	SKU-i828kn9h67x5vz1nsk2qvnro	15375	EUR	100	0	\N	t	2025-11-25 14:56:36.926	2025-11-25 14:56:36.926	\N
s8v5ymmvag8i97h27abuucbm	nrvc77uqaawbor31e1bx4c9a	bx89n9qi0t47pehsxuga8h99	SKU-bx89n9qi0t47pehsxuga8h99	8475	EUR	100	0	\N	t	2025-11-25 14:56:37.558	2025-11-25 14:56:37.558	\N
oj2bwfzcjtk7abr4k1ri9wlm	nrvc77uqaawbor31e1bx4c9a	slyygis4b9yvvj6evjzzmpu2	SKU-slyygis4b9yvvj6evjzzmpu2	8850	EUR	100	0	\N	t	2025-11-25 14:56:38.196	2025-11-25 14:56:38.196	\N
z6kkn5tadtmhwlaskef79zfs	nrvc77uqaawbor31e1bx4c9a	p5jisg7a90z2qiafhl5raovz	SKU-p5jisg7a90z2qiafhl5raovz	8250	EUR	100	0	\N	t	2025-11-25 14:56:38.837	2025-11-25 14:56:38.837	\N
dax9pbhe0dblicfgew8bx3va	nrvc77uqaawbor31e1bx4c9a	khrc7jjagwnrz50uimpf52wt	SKU-khrc7jjagwnrz50uimpf52wt	8100	EUR	100	0	\N	t	2025-11-25 14:56:39.543	2025-11-25 14:56:39.543	\N
i9w8lsebwa7eb2drrz9yzp3f	nrvc77uqaawbor31e1bx4c9a	v6xysoh1lc4edact92u7sbjo	SKU-v6xysoh1lc4edact92u7sbjo	7350	EUR	100	0	\N	t	2025-11-25 14:56:40.176	2025-11-25 14:56:40.176	\N
b2dql5ty8p8bhrt41nerwok8	nrvc77uqaawbor31e1bx4c9a	yhti670egdvx939eus4nf7c0	SKU-yhti670egdvx939eus4nf7c0	7575	EUR	100	0	\N	t	2025-11-25 14:56:40.818	2025-11-25 14:56:40.818	\N
vlgvmyt0ks75lccr6gngzmeu	nrvc77uqaawbor31e1bx4c9a	a0xii9yo5w3mif4ti11gde48	SKU-a0xii9yo5w3mif4ti11gde48	8100	EUR	100	0	\N	t	2025-11-25 14:56:41.45	2025-11-25 14:56:41.45	\N
sy6vlv03dcsguwruzbodr3hg	nrvc77uqaawbor31e1bx4c9a	vae8mf6rfhbwihc1dvljyenw	SKU-vae8mf6rfhbwihc1dvljyenw	12450	EUR	100	0	\N	t	2025-11-25 14:56:42.087	2025-11-25 14:56:42.087	\N
k8urntd8dwyw16neb4fam1zt	nrvc77uqaawbor31e1bx4c9a	s8afijvewrtciwe8y0i1u6zm	SKU-s8afijvewrtciwe8y0i1u6zm	191	EUR	100	0	\N	t	2025-11-25 14:56:42.72	2025-11-25 14:56:42.72	\N
w8cgmp9rizp6nx3gidmmqyxt	nrvc77uqaawbor31e1bx4c9a	k0zjxxstd2ebcecgxi40dnwc	SKU-k0zjxxstd2ebcecgxi40dnwc	156	EUR	100	0	\N	t	2025-11-25 14:56:43.355	2025-11-25 14:56:43.355	\N
tguiei7dfecbq5j69ls8yp0m	nrvc77uqaawbor31e1bx4c9a	tejhb7nh2gj5g3968gvvqsy3	SKU-tejhb7nh2gj5g3968gvvqsy3	156	EUR	100	0	\N	t	2025-11-25 14:56:43.99	2025-11-25 14:56:43.99	\N
prftx6uaow7nwygi0iyq9qs4	nrvc77uqaawbor31e1bx4c9a	n4vc7js5ah4c3j2i1id7givp	SKU-n4vc7js5ah4c3j2i1id7givp	89	EUR	100	0	\N	t	2025-11-25 14:56:44.629	2025-11-25 14:56:44.629	\N
g4jpbdsb9nnwfax9toqfztap	nrvc77uqaawbor31e1bx4c9a	onldg2o2v3gc0odtnbg1qbn5	SKU-onldg2o2v3gc0odtnbg1qbn5	92	EUR	100	0	\N	t	2025-11-25 14:56:45.263	2025-11-25 14:56:45.263	\N
ci83x08rqliohz9xadjk5u89	nrvc77uqaawbor31e1bx4c9a	op6ibjzmdkh0x83ak0ogxsw9	SKU-op6ibjzmdkh0x83ak0ogxsw9	127	EUR	100	0	\N	t	2025-11-25 14:56:45.902	2025-11-25 14:56:45.902	\N
ly8pifn4307z0au2luk4jekd	nrvc77uqaawbor31e1bx4c9a	m0mo4xugg5ii49dgrhvxbk0j	SKU-m0mo4xugg5ii49dgrhvxbk0j	106	EUR	100	0	\N	t	2025-11-25 14:56:46.532	2025-11-25 14:56:46.532	\N
wytfenj5guq29xoms5xdswkl	nrvc77uqaawbor31e1bx4c9a	af9ahfijkk3x2c2qy02uviqe	SKU-af9ahfijkk3x2c2qy02uviqe	155	EUR	100	0	\N	t	2025-11-25 14:56:47.165	2025-11-25 14:56:47.165	\N
qqfckoln5j15txukou1mfefe	nrvc77uqaawbor31e1bx4c9a	wiac9ofsmnospqu5xnf9ujbw	SKU-wiac9ofsmnospqu5xnf9ujbw	136	EUR	100	0	\N	t	2025-11-25 14:56:47.799	2025-11-25 14:56:47.799	\N
azqafdxl6fykwy5sdyckhqxe	nrvc77uqaawbor31e1bx4c9a	vsdxqclu9e9gpb7xu5nm8sfv	SKU-vsdxqclu9e9gpb7xu5nm8sfv	124	EUR	100	0	\N	t	2025-11-25 14:56:48.432	2025-11-25 14:56:48.432	\N
k74zsypfye80bza6b25hg6ko	nrvc77uqaawbor31e1bx4c9a	ri6ofassu9hs1lyeu6ci695m	SKU-ri6ofassu9hs1lyeu6ci695m	139	EUR	100	0	\N	t	2025-11-25 14:56:49.064	2025-11-25 14:56:49.064	\N
dmez8lgp3xa1fchufid859pa	nrvc77uqaawbor31e1bx4c9a	g77ye7fl4ty6xr83enocetw4	SKU-g77ye7fl4ty6xr83enocetw4	253	EUR	100	0	\N	t	2025-11-25 14:56:49.695	2025-11-25 14:56:49.695	\N
f8z67o5746yjigag8z7chqmo	nrvc77uqaawbor31e1bx4c9a	kd4lik7364sq6jovpzjv1olu	SKU-kd4lik7364sq6jovpzjv1olu	105	EUR	100	0	\N	t	2025-11-25 14:56:50.329	2025-11-25 14:56:50.329	\N
sd75f30odd3k3eq9h9cnaxbz	nrvc77uqaawbor31e1bx4c9a	n1p3abplkn6ymyyvu2iqz3ua	SKU-n1p3abplkn6ymyyvu2iqz3ua	196	EUR	100	0	\N	t	2025-11-25 14:56:50.962	2025-11-25 14:56:50.962	\N
ocxctlm3fb7fdm606k3upu3p	nrvc77uqaawbor31e1bx4c9a	g9ha6ym6mm1qypio148qncve	SKU-g9ha6ym6mm1qypio148qncve	100	EUR	100	0	\N	t	2025-11-25 14:56:51.593	2025-11-25 14:56:51.593	\N
l3avc5dsp0qo77msg0ikxc45	nrvc77uqaawbor31e1bx4c9a	cpkihefn8jnyftvgahlsadyk	SKU-cpkihefn8jnyftvgahlsadyk	100	EUR	100	0	\N	t	2025-11-25 14:56:52.225	2025-11-25 14:56:52.225	\N
l5lheh841h7rygle1vzclwgl	nrvc77uqaawbor31e1bx4c9a	j99xer2i2175zlcm6dl871bh	SKU-j99xer2i2175zlcm6dl871bh	100	EUR	100	0	\N	t	2025-11-25 14:56:52.858	2025-11-25 14:56:52.858	\N
t5jgqr80milc44xa82nuggrr	nrvc77uqaawbor31e1bx4c9a	lw0xriy9xjehxcokngmdgl7l	SKU-lw0xriy9xjehxcokngmdgl7l	113	EUR	100	0	\N	t	2025-11-25 14:56:53.49	2025-11-25 14:56:53.49	\N
lp8233ytf5uuz9zd5b80lw7y	nrvc77uqaawbor31e1bx4c9a	zqkw5o3glnupknckuk32qm6d	SKU-zqkw5o3glnupknckuk32qm6d	113	EUR	100	0	\N	t	2025-11-25 14:56:54.125	2025-11-25 14:56:54.125	\N
a8htr64wzstt6k5h4jcx1351	nrvc77uqaawbor31e1bx4c9a	mb5k8ahnok94gpgice8sugyk	SKU-mb5k8ahnok94gpgice8sugyk	146	EUR	100	0	\N	t	2025-11-25 14:56:54.83	2025-11-25 14:56:54.83	\N
grgqpa3rfld66wrkhrn00v93	nrvc77uqaawbor31e1bx4c9a	tk9qq5f3g364ez2r6r4i6gvl	SKU-tk9qq5f3g364ez2r6r4i6gvl	128	EUR	100	0	\N	t	2025-11-25 14:56:55.463	2025-11-25 14:56:55.463	\N
hrlzeazvnrr54fbxrvs9jxjc	nrvc77uqaawbor31e1bx4c9a	bwv5j4c5v2gouurh19boyvsx	SKU-bwv5j4c5v2gouurh19boyvsx	119	EUR	100	0	\N	t	2025-11-25 14:56:56.1	2025-11-25 14:56:56.1	\N
g2al3y7se36st8klk58mwuqo	nrvc77uqaawbor31e1bx4c9a	l5c6rflx0d18ysdag0vv90q7	SKU-l5c6rflx0d18ysdag0vv90q7	133	EUR	100	0	\N	t	2025-11-25 14:56:56.739	2025-11-25 14:56:56.739	\N
q560xmdjpa9yfuijkpee0oe1	nrvc77uqaawbor31e1bx4c9a	lzngvtga4xv3cubzuz80lon1	SKU-lzngvtga4xv3cubzuz80lon1	84	EUR	100	0	\N	t	2025-11-25 14:56:57.373	2025-11-25 14:56:57.373	\N
zxi7vsfzuhylcr9j8scoii69	nrvc77uqaawbor31e1bx4c9a	b1fnu2oecikqe6md3vur5hoq	SKU-b1fnu2oecikqe6md3vur5hoq	111	EUR	100	0	\N	t	2025-11-25 14:56:58.003	2025-11-25 14:56:58.003	\N
ncp1kcr7txs0oh3az48z1dwt	nrvc77uqaawbor31e1bx4c9a	hbijs2wxa61f8vzs5fjektxy	SKU-hbijs2wxa61f8vzs5fjektxy	97	EUR	100	0	\N	t	2025-11-25 14:56:58.638	2025-11-25 14:56:58.638	\N
uwgcdx24awcl1s2zt7x0per5	nrvc77uqaawbor31e1bx4c9a	zte700vh2js7vw3rsodcse21	SKU-zte700vh2js7vw3rsodcse21	91	EUR	100	0	\N	t	2025-11-25 14:56:59.271	2025-11-25 14:56:59.271	\N
r2h44puupml1r01z29s1x0re	nrvc77uqaawbor31e1bx4c9a	pgb6vshz3fe009awvcz50nhf	SKU-pgb6vshz3fe009awvcz50nhf	82	EUR	100	0	\N	t	2025-11-25 14:56:59.911	2025-11-25 14:56:59.911	\N
ddxztle4cr1vj1sj7pnkvj9w	nrvc77uqaawbor31e1bx4c9a	jtz52732p74iomwtmcbq3vmt	SKU-jtz52732p74iomwtmcbq3vmt	113	EUR	100	0	\N	t	2025-11-25 14:57:00.546	2025-11-25 14:57:00.546	\N
m6wxuiytl8d16fys8700oc5a	nrvc77uqaawbor31e1bx4c9a	nsjxt4e9ubqe76d42tyn942n	SKU-nsjxt4e9ubqe76d42tyn942n	113	EUR	100	0	\N	t	2025-11-25 14:57:01.187	2025-11-25 14:57:01.187	\N
vf8e2v7mstwvczked43lc1ah	nrvc77uqaawbor31e1bx4c9a	q33dlezk3jmugglctfhse1vq	SKU-q33dlezk3jmugglctfhse1vq	113	EUR	100	0	\N	t	2025-11-25 14:57:01.826	2025-11-25 14:57:01.826	\N
djsq9iie9q7gosxx3zbafufv	nrvc77uqaawbor31e1bx4c9a	n7u04jr75lxw6tkt0zgjyqf4	SKU-n7u04jr75lxw6tkt0zgjyqf4	84	EUR	100	0	\N	t	2025-11-25 14:57:02.454	2025-11-25 14:57:02.454	\N
iha4luxof8xrrjuogva1wt61	nrvc77uqaawbor31e1bx4c9a	ceu6gu1hy35mwn1gic84fhmc	SKU-ceu6gu1hy35mwn1gic84fhmc	137	EUR	100	0	\N	t	2025-11-25 14:57:03.09	2025-11-25 14:57:03.09	\N
ix7gin2eekzyheltzvqw7jes	nrvc77uqaawbor31e1bx4c9a	s92fx01yr1bromlzfqxt4cpc	SKU-s92fx01yr1bromlzfqxt4cpc	103	EUR	100	0	\N	t	2025-11-25 14:57:03.72	2025-11-25 14:57:03.72	\N
zc19bcmcskz57nv5eqq7k2hc	nrvc77uqaawbor31e1bx4c9a	nqal3dngv5iveq5e8c15powk	SKU-nqal3dngv5iveq5e8c15powk	84	EUR	100	0	\N	t	2025-11-25 14:57:04.364	2025-11-25 14:57:04.364	\N
sv3c3ym90f4qf4lztv6clbg7	nrvc77uqaawbor31e1bx4c9a	sdn4bupxyp2mtb92cdlztfw5	SKU-sdn4bupxyp2mtb92cdlztfw5	106	EUR	100	0	\N	t	2025-11-25 14:57:04.996	2025-11-25 14:57:04.996	\N
b2ogm5fmd7a73cgf9lz2bkk4	nrvc77uqaawbor31e1bx4c9a	iqcg0co22oho01gbwgm4lqdh	SKU-iqcg0co22oho01gbwgm4lqdh	106	EUR	100	0	\N	t	2025-11-25 14:57:05.629	2025-11-25 14:57:05.629	\N
gvlb0k1yi9pcwviobf959hku	nrvc77uqaawbor31e1bx4c9a	qodjubxm5pxyyhl1es83c4jc	SKU-qodjubxm5pxyyhl1es83c4jc	371	EUR	100	0	\N	t	2025-11-25 15:07:50.569	2025-11-25 15:07:50.569	\N
rh4v6efn1fdjjnbao83uqkl2	nrvc77uqaawbor31e1bx4c9a	yrp4jdkpef4q7cfd0zd5b3tu	SKU-yrp4jdkpef4q7cfd0zd5b3tu	6205	EUR	100	0	\N	t	2025-11-25 15:07:51.197	2025-11-25 15:07:51.197	\N
z6p9sbzn7copgh888charkcj	nrvc77uqaawbor31e1bx4c9a	o87aamqolvx5ukb7plphizq6	SKU-o87aamqolvx5ukb7plphizq6	1556	EUR	100	0	\N	t	2025-11-25 15:07:51.837	2025-11-25 15:07:51.837	\N
n97vavzaj1oashr5v4usad2p	nrvc77uqaawbor31e1bx4c9a	j68m7wrw3tx8zjnjgdsj8v4d	SKU-j68m7wrw3tx8zjnjgdsj8v4d	999	EUR	100	0	\N	t	2025-11-25 15:07:53.256	2025-11-25 15:07:53.256	\N
voju5uykyl4034carg7l8v9p	nrvc77uqaawbor31e1bx4c9a	ehdthix4ia8rg5n9kgmchnqd	SKU-ehdthix4ia8rg5n9kgmchnqd	874	EUR	100	0	\N	t	2025-11-25 15:07:54.188	2025-11-25 15:07:54.188	\N
v6ejpuwe76c5l2le9c7by59k	nrvc77uqaawbor31e1bx4c9a	vg42dyi2xuie2vodpxcwa2po	SKU-vg42dyi2xuie2vodpxcwa2po	468	EUR	100	0	\N	t	2025-11-25 15:07:54.823	2025-11-25 15:07:54.823	\N
na8dxdyibe7g1155b1h2ck35	nrvc77uqaawbor31e1bx4c9a	aq33hm7pjxoa5rvza9nrm9id	SKU-aq33hm7pjxoa5rvza9nrm9id	326	EUR	100	0	\N	t	2025-11-25 15:07:55.494	2025-11-25 15:07:55.494	\N
ure3an9byikyrz62gwxu9s4d	nrvc77uqaawbor31e1bx4c9a	exieafxrgyn2digf0kmrv7b6	SKU-exieafxrgyn2digf0kmrv7b6	827	EUR	100	0	\N	t	2025-11-25 15:07:56.128	2025-11-25 15:07:56.128	\N
f0ik8u58nmk350xklmrp8pnm	nrvc77uqaawbor31e1bx4c9a	tajbmrmsv7zuomk781a7u5to	SKU-tajbmrmsv7zuomk781a7u5to	656	EUR	100	0	\N	t	2025-11-25 15:07:56.773	2025-11-25 15:07:56.773	\N
tbayux8zg4qq2m04vwnu4q4f	nrvc77uqaawbor31e1bx4c9a	wlrkrbuknc57wodc3e124zlk	SKU-wlrkrbuknc57wodc3e124zlk	1428	EUR	100	0	\N	t	2025-11-25 15:07:57.404	2025-11-25 15:07:57.404	\N
mpo9ql7ngw5syzpgqc75mn3z	nrvc77uqaawbor31e1bx4c9a	cd6ogj9ah4zhh8wx5zqc59i8	SKU-cd6ogj9ah4zhh8wx5zqc59i8	918	EUR	100	0	\N	t	2025-11-25 15:07:58.041	2025-11-25 15:07:58.041	\N
g9hs63d4y820nf6jcyrw4e9b	nrvc77uqaawbor31e1bx4c9a	jz5952do1ni0mbrelpl3izhj	SKU-jz5952do1ni0mbrelpl3izhj	925	EUR	100	0	\N	t	2025-11-25 15:07:58.677	2025-11-25 15:07:58.677	\N
ye5mp5at6psxx8z3ixh7l884	nrvc77uqaawbor31e1bx4c9a	mimepju9e7tnke95kldrj4vo	SKU-mimepju9e7tnke95kldrj4vo	885	EUR	100	0	\N	t	2025-11-25 15:07:59.336	2025-11-25 15:07:59.336	\N
r4a1tij4dlembz4o882wg3kv	nrvc77uqaawbor31e1bx4c9a	isnrajjxp2mrmwsttn1e77oj	SKU-isnrajjxp2mrmwsttn1e77oj	646	EUR	100	0	\N	t	2025-11-25 15:07:59.972	2025-11-25 15:07:59.972	\N
g0aptiubxggvlp6xjq6j33rs	nrvc77uqaawbor31e1bx4c9a	tjh603n80umzh89z1ix23l8d	SKU-tjh603n80umzh89z1ix23l8d	504	EUR	100	0	\N	t	2025-11-25 15:08:00.606	2025-11-25 15:08:00.606	\N
vhtz1pbm7sdh9dchxxzmpu6b	nrvc77uqaawbor31e1bx4c9a	e52xfueizlfppa90y2ru7dpb	SKU-e52xfueizlfppa90y2ru7dpb	839	EUR	100	0	\N	t	2025-11-25 15:08:01.242	2025-11-25 15:08:01.242	\N
jrx54bw7ffk8af5xwtrlzlc5	nrvc77uqaawbor31e1bx4c9a	mjnnajmcbzqumqi9qgpdey2i	SKU-mjnnajmcbzqumqi9qgpdey2i	843	EUR	100	0	\N	t	2025-11-25 15:08:01.88	2025-11-25 15:08:01.88	\N
xxofo5kdj7brnw4jadfufbn9	nrvc77uqaawbor31e1bx4c9a	fgmzq9k8mk2me55viuqw2b0c	SKU-fgmzq9k8mk2me55viuqw2b0c	829	EUR	100	0	\N	t	2025-11-25 15:08:02.519	2025-11-25 15:08:02.519	\N
oyjbgranyo6r59rgd8koe219	nrvc77uqaawbor31e1bx4c9a	z4qhg353117t6kmgfphilozm	SKU-z4qhg353117t6kmgfphilozm	897	EUR	100	0	\N	t	2025-11-25 15:08:03.152	2025-11-25 15:08:03.152	\N
abvzq1h3ds842fkma3homms0	nrvc77uqaawbor31e1bx4c9a	roem5se4rx6fh9htjw6m1onx	SKU-roem5se4rx6fh9htjw6m1onx	575	EUR	100	0	\N	t	2025-11-25 15:08:03.798	2025-11-25 15:08:03.798	\N
mnyb2969w7n2xow91tm4zezt	nrvc77uqaawbor31e1bx4c9a	vc7n2xbgbui29rhuabemytzl	SKU-vc7n2xbgbui29rhuabemytzl	1726	EUR	100	0	\N	t	2025-11-25 15:08:04.43	2025-11-25 15:08:04.43	\N
q2ontmbtekgd0owwvq4ocf4a	nrvc77uqaawbor31e1bx4c9a	qkhrlrmb62n264sff0cwhd8u	SKU-qkhrlrmb62n264sff0cwhd8u	567	EUR	100	0	\N	t	2025-11-25 15:08:05.064	2025-11-25 15:08:05.064	\N
orr4ykd7xw4ylanz0dwmvy6y	nrvc77uqaawbor31e1bx4c9a	vyfeq6mavugqul6lxbne60mz	SKU-vyfeq6mavugqul6lxbne60mz	538	EUR	100	0	\N	t	2025-11-25 15:08:05.701	2025-11-25 15:08:05.701	\N
dyn0qnkca2m6c2y3jvx5oej4	nrvc77uqaawbor31e1bx4c9a	tlrjhunxc66om5yvlxg9kewx	SKU-tlrjhunxc66om5yvlxg9kewx	510	EUR	100	0	\N	t	2025-11-25 15:08:06.336	2025-11-25 15:08:06.336	\N
wlafs6b2ggpwfiehzn9fvxtg	nrvc77uqaawbor31e1bx4c9a	a0p8qfysqg2bjzfo2m0541jy	SKU-a0p8qfysqg2bjzfo2m0541jy	1054	EUR	100	0	\N	t	2025-11-25 15:08:06.968	2025-11-25 15:08:06.968	\N
ok5uyinpve8k4ozlex79rexe	nrvc77uqaawbor31e1bx4c9a	b8o8r6wo5tje9605w4uco9v5	SKU-b8o8r6wo5tje9605w4uco9v5	887	EUR	100	0	\N	t	2025-11-25 15:08:07.609	2025-11-25 15:08:07.609	\N
kp6mhwps98z1nb3t64cdv3ai	nrvc77uqaawbor31e1bx4c9a	f7i0p0qleue9t86n9gaayz8w	SKU-f7i0p0qleue9t86n9gaayz8w	533	EUR	100	0	\N	t	2025-11-25 15:08:08.343	2025-11-25 15:08:08.343	\N
l9q7ujhjbq888e6zynejz7c7	nrvc77uqaawbor31e1bx4c9a	wb8q8fn4jd5r69rdhkiiodao	SKU-wb8q8fn4jd5r69rdhkiiodao	1700	EUR	100	0	\N	t	2025-11-25 15:08:09.001	2025-11-25 15:08:09.001	\N
wrt5iuugdpa94pc6gfsexvga	nrvc77uqaawbor31e1bx4c9a	o40vec5vkzpqesiz374oakqc	SKU-o40vec5vkzpqesiz374oakqc	2533	EUR	100	0	\N	t	2025-11-25 15:08:09.636	2025-11-25 15:08:09.636	\N
wb7q9rma2nhjnw1sk2lxo6ig	nrvc77uqaawbor31e1bx4c9a	qns9n7mgegbcf0o8xpgoqokn	SKU-qns9n7mgegbcf0o8xpgoqokn	867	EUR	100	0	\N	t	2025-11-25 15:08:10.276	2025-11-25 15:08:10.276	\N
lqrrew7a50dx1yigqhrz1rmg	nrvc77uqaawbor31e1bx4c9a	ln6q3t853mb22v5pq5aazmld	SKU-ln6q3t853mb22v5pq5aazmld	1523	EUR	100	0	\N	t	2025-11-25 15:08:10.912	2025-11-25 15:08:10.912	\N
qsoicj67du9e0a0tdx1kiono	nrvc77uqaawbor31e1bx4c9a	i4ti9sebh3h8lkceowzzf09r	SKU-i4ti9sebh3h8lkceowzzf09r	1088	EUR	100	0	\N	t	2025-11-25 15:08:11.559	2025-11-25 15:08:11.559	\N
c5eukf4f2cp28cl1degn1kmk	nrvc77uqaawbor31e1bx4c9a	kd85e2srsx2mpjic66gm35we	SKU-kd85e2srsx2mpjic66gm35we	3528	EUR	100	0	\N	t	2025-11-25 15:08:12.193	2025-11-25 15:08:12.193	\N
oqchnkb8hfc82ufgdq22xjdm	nrvc77uqaawbor31e1bx4c9a	nsevqgh9r64sdlxjyzlt1awn	SKU-nsevqgh9r64sdlxjyzlt1awn	992	EUR	100	0	\N	t	2025-11-25 15:08:12.874	2025-11-25 15:08:12.874	\N
ya4cnnheyycvkskrz0yv8t0h	nrvc77uqaawbor31e1bx4c9a	vl9dhk7akhsszlo0eu389874	SKU-vl9dhk7akhsszlo0eu389874	2465	EUR	100	0	\N	t	2025-11-25 15:08:13.515	2025-11-25 15:08:13.515	\N
onjacr4oow30k7gbyudp4v9e	nrvc77uqaawbor31e1bx4c9a	j9tggsurrt4ojl1z9cvh3d1f	SKU-j9tggsurrt4ojl1z9cvh3d1f	1615	EUR	100	0	\N	t	2025-11-25 15:08:14.15	2025-11-25 15:08:14.15	\N
w87esurd1f9abrk23jo8jfud	nrvc77uqaawbor31e1bx4c9a	f7jpnhj8169c36ckn9pimfrt	SKU-f7jpnhj8169c36ckn9pimfrt	408	EUR	100	0	\N	t	2025-11-25 15:08:14.783	2025-11-25 15:08:14.783	\N
epnf9ly6o793aapddk758m1s	nrvc77uqaawbor31e1bx4c9a	n49h1g1klaeesefsns2x0aj7	SKU-n49h1g1klaeesefsns2x0aj7	2125	EUR	100	0	\N	t	2025-11-25 15:08:15.424	2025-11-25 15:08:15.424	\N
bs14ffy2av2ouy01pcv8ti5p	nrvc77uqaawbor31e1bx4c9a	rww5v63ni67a4dcpxxhk441t	SKU-rww5v63ni67a4dcpxxhk441t	1084	EUR	100	0	\N	t	2025-11-25 15:08:16.061	2025-11-25 15:08:16.061	\N
espei2hokh4nl2wmcijcli4n	nrvc77uqaawbor31e1bx4c9a	f7owdzvos2nijgw2oy592qxq	SKU-f7owdzvos2nijgw2oy592qxq	2720	EUR	100	0	\N	t	2025-11-25 15:08:16.696	2025-11-25 15:08:16.696	\N
ebw4l6nny5ba3w5eb356wmue	nrvc77uqaawbor31e1bx4c9a	vkxtto7tndg5edn01osrvlpz	SKU-vkxtto7tndg5edn01osrvlpz	857	EUR	100	0	\N	t	2025-11-25 15:08:17.334	2025-11-25 15:08:17.334	\N
odfgl2f859gbwpdlkmexsjqs	nrvc77uqaawbor31e1bx4c9a	khw9drngc90klegiacrhawb8	SKU-khw9drngc90klegiacrhawb8	156	EUR	100	0	\N	t	2025-11-25 14:57:06.262	2025-11-25 14:57:06.262	\N
lrp81gjh8f7vv8iyfaaotxat	nrvc77uqaawbor31e1bx4c9a	u1pxfmy32xpl8tj10x41fbig	SKU-u1pxfmy32xpl8tj10x41fbig	84	EUR	100	0	\N	t	2025-11-25 14:57:06.893	2025-11-25 14:57:06.893	\N
jjzzxrz7e1s4tu5khiwjgv8s	nrvc77uqaawbor31e1bx4c9a	ppb49sxtoirbsdgrd67uum6x	SKU-ppb49sxtoirbsdgrd67uum6x	161	EUR	100	0	\N	t	2025-11-25 14:57:07.523	2025-11-25 14:57:07.523	\N
qnkszeq8vrn29vvzgpqgyh88	nrvc77uqaawbor31e1bx4c9a	s47zetx7yvrzdu5q7rekpdg2	SKU-s47zetx7yvrzdu5q7rekpdg2	150	EUR	100	0	\N	t	2025-11-25 14:57:08.164	2025-11-25 14:57:08.164	\N
akz3miy1fjmm4i8ll6liiryd	nrvc77uqaawbor31e1bx4c9a	w3ry9ee5phoq3n5sb8xkexkk	SKU-w3ry9ee5phoq3n5sb8xkexkk	148	EUR	100	0	\N	t	2025-11-25 14:57:08.798	2025-11-25 14:57:08.798	\N
r545xz3fvtrptxjoezr47o7g	nrvc77uqaawbor31e1bx4c9a	q4ne889xt4o3re11k93b4iqd	SKU-q4ne889xt4o3re11k93b4iqd	165	EUR	100	0	\N	t	2025-11-25 14:57:09.429	2025-11-25 14:57:09.429	\N
p3khnylhl36ijbld3bnrxxxo	nrvc77uqaawbor31e1bx4c9a	ptz96psegb666se5nq3yc2ns	SKU-ptz96psegb666se5nq3yc2ns	180	EUR	100	0	\N	t	2025-11-25 14:57:10.133	2025-11-25 14:57:10.133	\N
a4g93nc4vczgyt5ox705hnne	nrvc77uqaawbor31e1bx4c9a	oqmep5ej2186ocyik10gwzxd	SKU-oqmep5ej2186ocyik10gwzxd	123	EUR	100	0	\N	t	2025-11-25 14:57:10.764	2025-11-25 14:57:10.764	\N
lfk8ey66biixhvcpf2z0sm1u	nrvc77uqaawbor31e1bx4c9a	x75ebenn05zy1isag96minam	SKU-x75ebenn05zy1isag96minam	131	EUR	100	0	\N	t	2025-11-25 14:57:11.4	2025-11-25 14:57:11.4	\N
mdbal02nq8ctyvuz2hn65c6t	nrvc77uqaawbor31e1bx4c9a	kk9nqidggalj0uhx39g5zc0o	SKU-kk9nqidggalj0uhx39g5zc0o	119	EUR	100	0	\N	t	2025-11-25 14:57:12.273	2025-11-25 14:57:12.273	\N
uprrv8rxu4j8e988dz8kaivb	nrvc77uqaawbor31e1bx4c9a	thc1o32qg9asff0pe9trlu92	SKU-thc1o32qg9asff0pe9trlu92	164	EUR	100	0	\N	t	2025-11-25 14:57:12.908	2025-11-25 14:57:12.908	\N
beb08zob2i3vq4mprrxeisny	nrvc77uqaawbor31e1bx4c9a	aap49r4bchjjiwig26utt7re	SKU-aap49r4bchjjiwig26utt7re	203	EUR	100	0	\N	t	2025-11-25 14:57:13.539	2025-11-25 14:57:13.539	\N
ufd28nmtualj3ngwjp6pfl38	nrvc77uqaawbor31e1bx4c9a	ofqca1uwb2gy667m2zz0y662	SKU-ofqca1uwb2gy667m2zz0y662	234	EUR	100	0	\N	t	2025-11-25 14:57:14.174	2025-11-25 14:57:14.174	\N
b9f8des5v3fhqcdhiu3bsmej	nrvc77uqaawbor31e1bx4c9a	ybzxh4e73gn5p5apxfozlmy9	SKU-ybzxh4e73gn5p5apxfozlmy9	154	EUR	100	0	\N	t	2025-11-25 14:57:14.811	2025-11-25 14:57:14.811	\N
cy3z1kf0ydiuxxdwky92cnqg	nrvc77uqaawbor31e1bx4c9a	yuqnnuhcjszxi8uuy9vdgd5t	SKU-yuqnnuhcjszxi8uuy9vdgd5t	226	EUR	100	0	\N	t	2025-11-25 14:57:15.444	2025-11-25 14:57:15.444	\N
t3lmh3mrc7m4dwplnm9jvtcq	nrvc77uqaawbor31e1bx4c9a	h3hh58ehkc0szomgvroz4eg0	SKU-h3hh58ehkc0szomgvroz4eg0	244	EUR	100	0	\N	t	2025-11-25 14:57:16.073	2025-11-25 14:57:16.073	\N
x6ptzgem85qx225pqao2qlp1	nrvc77uqaawbor31e1bx4c9a	ii1z875irp91w1ae0e7jjv8f	SKU-ii1z875irp91w1ae0e7jjv8f	122	EUR	100	0	\N	t	2025-11-25 14:57:16.733	2025-11-25 14:57:16.733	\N
r1hwt5p1frn02aek034z75o8	nrvc77uqaawbor31e1bx4c9a	zak0w9yqzv10y6mrxa59ly6h	SKU-zak0w9yqzv10y6mrxa59ly6h	244	EUR	100	0	\N	t	2025-11-25 14:57:17.369	2025-11-25 14:57:17.369	\N
aul19ee6ueoldjnbx871uus6	nrvc77uqaawbor31e1bx4c9a	kvecvecfmxes807duuheftk4	SKU-kvecvecfmxes807duuheftk4	248	EUR	100	0	\N	t	2025-11-25 14:57:18.006	2025-11-25 14:57:18.006	\N
t4n702a4fkkkybi3sebqbiuz	nrvc77uqaawbor31e1bx4c9a	d75w47cpolr1uj88wrrcg8yx	SKU-d75w47cpolr1uj88wrrcg8yx	244	EUR	100	0	\N	t	2025-11-25 14:57:18.653	2025-11-25 14:57:18.653	\N
re9h5e97n5it1a8zadx8lv5q	nrvc77uqaawbor31e1bx4c9a	nfix2rrwtw1fbkflcve4gowg	SKU-nfix2rrwtw1fbkflcve4gowg	248	EUR	100	0	\N	t	2025-11-25 14:57:19.29	2025-11-25 14:57:19.29	\N
ffhiz2x23b1vtribvtr63ytv	nrvc77uqaawbor31e1bx4c9a	fyr271qbw9rrfs5kbaxo3dfj	SKU-fyr271qbw9rrfs5kbaxo3dfj	266	EUR	100	0	\N	t	2025-11-25 14:57:19.922	2025-11-25 14:57:19.922	\N
cstwfu8nphyg3ughfvwjvtqc	nrvc77uqaawbor31e1bx4c9a	azhz6p5lk16wkmd6kolpkvhk	SKU-azhz6p5lk16wkmd6kolpkvhk	163	EUR	100	0	\N	t	2025-11-25 14:57:20.551	2025-11-25 14:57:20.551	\N
rdxisk9oenkzpevdkzyzvxnt	nrvc77uqaawbor31e1bx4c9a	rvr51yx1b11iiw7obbscjnf3	SKU-rvr51yx1b11iiw7obbscjnf3	225	EUR	100	0	\N	t	2025-11-25 14:57:21.186	2025-11-25 14:57:21.186	\N
grtcclzjjoq2w2r9q2ax1ybr	nrvc77uqaawbor31e1bx4c9a	s9b8ox9nopmj27tjil7ocuwv	SKU-s9b8ox9nopmj27tjil7ocuwv	240	EUR	100	0	\N	t	2025-11-25 14:57:21.822	2025-11-25 14:57:21.822	\N
l1bwcggf8jwiih8rdtf15ugz	nrvc77uqaawbor31e1bx4c9a	de3qoffmrp2gtqgab4w62mii	SKU-de3qoffmrp2gtqgab4w62mii	168	EUR	100	0	\N	t	2025-11-25 14:57:22.469	2025-11-25 14:57:22.469	\N
u6chnmhxh4dpekqrv8akcac9	nrvc77uqaawbor31e1bx4c9a	xptq05sguems5orcdrby0ek4	SKU-xptq05sguems5orcdrby0ek4	169	EUR	100	0	\N	t	2025-11-25 14:57:23.103	2025-11-25 14:57:23.103	\N
yn4o8jaxszlghh4j5nr05vv3	nrvc77uqaawbor31e1bx4c9a	nezwazz2jkle1mpinc76syy4	SKU-nezwazz2jkle1mpinc76syy4	194	EUR	100	0	\N	t	2025-11-25 14:57:23.743	2025-11-25 14:57:23.743	\N
mtdqisf28fv63njpxahe9eu8	nrvc77uqaawbor31e1bx4c9a	ayigxmp8tx5gt5tmu9l8j54g	SKU-ayigxmp8tx5gt5tmu9l8j54g	375	EUR	100	0	\N	t	2025-11-25 14:57:24.374	2025-11-25 14:57:24.374	\N
q1powu8zmdnvq6kfdnmcpxjv	nrvc77uqaawbor31e1bx4c9a	jk22ljydvgch47nve53m7ro5	SKU-jk22ljydvgch47nve53m7ro5	470	EUR	100	0	\N	t	2025-11-25 14:57:25.079	2025-11-25 14:57:25.079	\N
t8y82oe97qfpitlrzk9ui3hx	nrvc77uqaawbor31e1bx4c9a	vhumvmjshtvi1csmemocnh6s	SKU-vhumvmjshtvi1csmemocnh6s	620	EUR	100	0	\N	t	2025-11-25 14:57:25.718	2025-11-25 14:57:25.718	\N
bq4fg9ojv3gjwolmdxa41fd5	nrvc77uqaawbor31e1bx4c9a	lt9rtw8sst7dd3lxs5isbi87	SKU-lt9rtw8sst7dd3lxs5isbi87	463	EUR	100	0	\N	t	2025-11-25 14:57:26.361	2025-11-25 14:57:26.361	\N
ji2vgzv26v5znllq5uwr0yfk	nrvc77uqaawbor31e1bx4c9a	pcif138enszi9dcd2489apg5	SKU-pcif138enszi9dcd2489apg5	5250	EUR	100	0	\N	t	2025-11-25 14:57:27.003	2025-11-25 14:57:27.003	\N
lvd3r7njk01ojrlorb6kvsdv	nrvc77uqaawbor31e1bx4c9a	nvnttegpdu76xfh5kvog0l0p	SKU-nvnttegpdu76xfh5kvog0l0p	7875	EUR	100	0	\N	t	2025-11-25 14:57:27.64	2025-11-25 14:57:27.64	\N
raeqgh1d3ufzaawiln4i6jss	nrvc77uqaawbor31e1bx4c9a	t1br8w24e9kswhpbh6dvlkd7	SKU-t1br8w24e9kswhpbh6dvlkd7	6750	EUR	100	0	\N	t	2025-11-25 14:57:28.271	2025-11-25 14:57:28.271	\N
hczuwbw4u5xoz8vd1fyonosx	nrvc77uqaawbor31e1bx4c9a	wzfwh74kwzwvtb5xkxf0aeml	SKU-wzfwh74kwzwvtb5xkxf0aeml	6600	EUR	100	0	\N	t	2025-11-25 14:57:28.902	2025-11-25 14:57:28.902	\N
p5is9580xfutom6ac95bdyb1	nrvc77uqaawbor31e1bx4c9a	nlehahux8fm919on372s4b3q	SKU-nlehahux8fm919on372s4b3q	10500	EUR	100	0	\N	t	2025-11-25 14:57:29.537	2025-11-25 14:57:29.537	\N
gnbkl0yy3girlby3os31ax15	nrvc77uqaawbor31e1bx4c9a	dqgwyjsmz84z9y39dkiv69oo	SKU-dqgwyjsmz84z9y39dkiv69oo	10650	EUR	100	0	\N	t	2025-11-25 14:57:30.177	2025-11-25 14:57:30.177	\N
zgimwhqto979ayp1ex8tku2s	nrvc77uqaawbor31e1bx4c9a	m1gkkwj1f60cjx8riyez8t2g	SKU-m1gkkwj1f60cjx8riyez8t2g	9900	EUR	100	0	\N	t	2025-11-25 14:57:30.813	2025-11-25 14:57:30.813	\N
j0jlll70y93yrfadkaostvx0	nrvc77uqaawbor31e1bx4c9a	fi9l6ws7zivdnikyr4c9c4xy	SKU-fi9l6ws7zivdnikyr4c9c4xy	9900	EUR	100	0	\N	t	2025-11-25 14:57:31.512	2025-11-25 14:57:31.512	\N
azmnqfrb84ulddcoasseb922	nrvc77uqaawbor31e1bx4c9a	yjxyrkoeivali61uayudirsf	SKU-yjxyrkoeivali61uayudirsf	7200	EUR	100	0	\N	t	2025-11-25 14:57:32.146	2025-11-25 14:57:32.146	\N
g8lb6n76nxq5p8u69v6lu2hp	nrvc77uqaawbor31e1bx4c9a	v9ryglx581smxu7pp015ct2g	SKU-v9ryglx581smxu7pp015ct2g	8775	EUR	100	0	\N	t	2025-11-25 14:57:32.775	2025-11-25 14:57:32.775	\N
z6hzvz56re67wa2d1e574xk5	nrvc77uqaawbor31e1bx4c9a	rkua36gf6t2byrhvy133qmsu	SKU-rkua36gf6t2byrhvy133qmsu	8775	EUR	100	0	\N	t	2025-11-25 14:57:33.412	2025-11-25 14:57:33.412	\N
b9uyf7xbp6kh4s6qb10v25sn	nrvc77uqaawbor31e1bx4c9a	e2jeyj15uj5acnzglh214bqz	SKU-e2jeyj15uj5acnzglh214bqz	13350	EUR	100	0	\N	t	2025-11-25 14:57:34.047	2025-11-25 14:57:34.047	\N
e49vdsalivevsbe1yhhl6utc	nrvc77uqaawbor31e1bx4c9a	zmxcqc079l8qbb07qrfsgs73	SKU-zmxcqc079l8qbb07qrfsgs73	10575	EUR	100	0	\N	t	2025-11-25 14:57:34.683	2025-11-25 14:57:34.683	\N
x6gw3m28y7vqim74irhld86c	nrvc77uqaawbor31e1bx4c9a	weulyya64e42auubwqxyhww1	SKU-weulyya64e42auubwqxyhww1	58	EUR	100	0	\N	t	2025-11-25 14:57:35.311	2025-11-25 14:57:35.311	\N
gkeubnficaxjdeciq559a001	nrvc77uqaawbor31e1bx4c9a	ouwq7h0yclw15u6vib47v3ig	SKU-ouwq7h0yclw15u6vib47v3ig	55	EUR	100	0	\N	t	2025-11-25 14:57:35.949	2025-11-25 14:57:35.949	\N
vqts4lerg9tc2imvl0wqqscs	nrvc77uqaawbor31e1bx4c9a	nxrkf20fs9wcvt2q23rxkyo3	SKU-nxrkf20fs9wcvt2q23rxkyo3	55	EUR	100	0	\N	t	2025-11-25 14:57:36.592	2025-11-25 14:57:36.592	\N
c9iv9510hqi1y91gkc4iahx6	nrvc77uqaawbor31e1bx4c9a	iprp8bopm4ubp9f0snwtf4m2	SKU-iprp8bopm4ubp9f0snwtf4m2	56	EUR	100	0	\N	t	2025-11-25 14:57:37.245	2025-11-25 14:57:37.245	\N
qkc66rer8pd7k55d6dkfjjgi	nrvc77uqaawbor31e1bx4c9a	vie6pwpzji1xbhhnhnveqfb5	SKU-vie6pwpzji1xbhhnhnveqfb5	55	EUR	100	0	\N	t	2025-11-25 14:57:37.881	2025-11-25 14:57:37.881	\N
nj7acgy3e9am5jita01mj9ps	nrvc77uqaawbor31e1bx4c9a	d26icx78qjekr7bqjfuxlqlp	SKU-d26icx78qjekr7bqjfuxlqlp	55	EUR	100	0	\N	t	2025-11-25 14:57:38.516	2025-11-25 14:57:38.516	\N
zlqall0q52cvhbtmlvy0x9x9	nrvc77uqaawbor31e1bx4c9a	pjwbloaddl7xh99dulc169fb	SKU-pjwbloaddl7xh99dulc169fb	55	EUR	100	0	\N	t	2025-11-25 14:57:39.151	2025-11-25 14:57:39.151	\N
ca4hsmkhzu350d2nkhfjma0u	nrvc77uqaawbor31e1bx4c9a	tgpwrpaosv4hnezw0ytdm9c6	SKU-tgpwrpaosv4hnezw0ytdm9c6	88	EUR	100	0	\N	t	2025-11-25 14:57:39.782	2025-11-25 14:57:39.782	\N
hehvhsbzvtru21n40eh4vm4n	nrvc77uqaawbor31e1bx4c9a	kd231uom4arnim97au7rotl8	SKU-kd231uom4arnim97au7rotl8	55	EUR	100	0	\N	t	2025-11-25 14:57:40.49	2025-11-25 14:57:40.49	\N
py1n5i9vu59lh3pxkqdj2y85	nrvc77uqaawbor31e1bx4c9a	ip0hu1f0w5lixz13ehlh0cgb	SKU-ip0hu1f0w5lixz13ehlh0cgb	55	EUR	100	0	\N	t	2025-11-25 14:57:41.128	2025-11-25 14:57:41.128	\N
na6vhewqwl0jp66353jjjj2l	nrvc77uqaawbor31e1bx4c9a	gb0dbk77to79f3ryjdpqyhcl	SKU-gb0dbk77to79f3ryjdpqyhcl	55	EUR	100	0	\N	t	2025-11-25 14:57:41.758	2025-11-25 14:57:41.758	\N
t2d6k17u6sz19txf9bpf9gtz	nrvc77uqaawbor31e1bx4c9a	b7btg7iaxuyfbxadzmxewoxd	SKU-b7btg7iaxuyfbxadzmxewoxd	59	EUR	100	0	\N	t	2025-11-25 14:57:42.39	2025-11-25 14:57:42.39	\N
ws1i8sgy351w6ztwkhm9r2uf	nrvc77uqaawbor31e1bx4c9a	e67nfhlu3xxjz6ybm37ai1sv	SKU-e67nfhlu3xxjz6ybm37ai1sv	59	EUR	100	0	\N	t	2025-11-25 14:57:43.03	2025-11-25 14:57:43.03	\N
zc2pyikifk9sbm1j7i3jypw0	nrvc77uqaawbor31e1bx4c9a	ql2x42ilscuw35i6qbbpgogy	SKU-ql2x42ilscuw35i6qbbpgogy	72	EUR	100	0	\N	t	2025-11-25 14:57:43.661	2025-11-25 14:57:43.661	\N
qmku4hz83kv5sj3zqscvvo2y	nrvc77uqaawbor31e1bx4c9a	eiyfwvdetfa7e180n621h3tk	SKU-eiyfwvdetfa7e180n621h3tk	60	EUR	100	0	\N	t	2025-11-25 14:57:44.303	2025-11-25 14:57:44.303	\N
bmupreqay93rzppqefdpxh93	nrvc77uqaawbor31e1bx4c9a	dyrxsp2ha7ihzaoecb7b6r74	SKU-dyrxsp2ha7ihzaoecb7b6r74	59	EUR	100	0	\N	t	2025-11-25 14:57:44.938	2025-11-25 14:57:44.938	\N
ot8muwyzd9ludjq1sdym562a	nrvc77uqaawbor31e1bx4c9a	ug7o9fdm0eunxjhzk8z4rwud	SKU-ug7o9fdm0eunxjhzk8z4rwud	59	EUR	100	0	\N	t	2025-11-25 14:57:45.668	2025-11-25 14:57:45.668	\N
zlapcyb4jfvgqyxdxglpa2tf	nrvc77uqaawbor31e1bx4c9a	e5vgxcf62bo00a0atvdc4cd1	SKU-e5vgxcf62bo00a0atvdc4cd1	59	EUR	100	0	\N	t	2025-11-25 14:57:46.3	2025-11-25 14:57:46.3	\N
abked7sjcylmnem4lr88xbcf	nrvc77uqaawbor31e1bx4c9a	koovzwvlqn5r3ztlqaifqds7	SKU-koovzwvlqn5r3ztlqaifqds7	59	EUR	100	0	\N	t	2025-11-25 14:57:46.944	2025-11-25 14:57:46.944	\N
urz43z6d3ojgtso2obndvvdc	nrvc77uqaawbor31e1bx4c9a	bzwxfk4k117nklqgozudesax	SKU-bzwxfk4k117nklqgozudesax	59	EUR	100	0	\N	t	2025-11-25 14:57:47.579	2025-11-25 14:57:47.579	\N
vw3i4vb52u131ny0q29ow7iy	nrvc77uqaawbor31e1bx4c9a	dufcjqfr90qorz78src3e8st	SKU-dufcjqfr90qorz78src3e8st	72	EUR	100	0	\N	t	2025-11-25 14:57:48.208	2025-11-25 14:57:48.208	\N
h6516gavocqwk8272inhl3j3	nrvc77uqaawbor31e1bx4c9a	vbjeqbvxvsr9x0ruyn4hho2s	SKU-vbjeqbvxvsr9x0ruyn4hho2s	59	EUR	100	0	\N	t	2025-11-25 14:57:48.841	2025-11-25 14:57:48.841	\N
mzkxrsrlocerzt60p4wtcxbk	nrvc77uqaawbor31e1bx4c9a	rm33fqgkwthcjerh9k3ciuyr	SKU-rm33fqgkwthcjerh9k3ciuyr	59	EUR	100	0	\N	t	2025-11-25 14:57:49.473	2025-11-25 14:57:49.473	\N
wiyak5n0cvp39ppkesohr8jz	nrvc77uqaawbor31e1bx4c9a	k3jilfj7g5t0c3qf5za3tz5v	SKU-k3jilfj7g5t0c3qf5za3tz5v	72	EUR	100	0	\N	t	2025-11-25 14:57:50.106	2025-11-25 14:57:50.106	\N
avy2ph88wqmp3gifs142r5dk	nrvc77uqaawbor31e1bx4c9a	db5phinimlhl3i6vrrbqa5y0	SKU-db5phinimlhl3i6vrrbqa5y0	91	EUR	100	0	\N	t	2025-11-25 14:57:51.534	2025-11-25 14:57:51.534	\N
fbuzws1q2bbt2qdio2mxmulm	nrvc77uqaawbor31e1bx4c9a	vffk1ebz4on6wfdhz74kinsv	SKU-vffk1ebz4on6wfdhz74kinsv	59	EUR	100	0	\N	t	2025-11-25 14:57:52.465	2025-11-25 14:57:52.465	\N
kmzmzuiqppy8oyuwaqus7ifg	nrvc77uqaawbor31e1bx4c9a	r49wver6hmmuj5bzgbmfynbz	SKU-r49wver6hmmuj5bzgbmfynbz	72	EUR	100	0	\N	t	2025-11-25 14:57:53.105	2025-11-25 14:57:53.105	\N
xjf182hkod74zp0n3v72vgbk	nrvc77uqaawbor31e1bx4c9a	l0c7ugd10mgva66zv7bs3oec	SKU-l0c7ugd10mgva66zv7bs3oec	59	EUR	100	0	\N	t	2025-11-25 14:57:53.743	2025-11-25 14:57:53.743	\N
re37sssum1khwkoqk38rh383	nrvc77uqaawbor31e1bx4c9a	cp8o9caowjlnk1bq1nwot4gy	SKU-cp8o9caowjlnk1bq1nwot4gy	72	EUR	100	0	\N	t	2025-11-25 14:57:54.383	2025-11-25 14:57:54.383	\N
rwylc69cnd98qe0v55fji1g2	nrvc77uqaawbor31e1bx4c9a	k4t6c0v8ic2bsxiwq636nihc	SKU-k4t6c0v8ic2bsxiwq636nihc	59	EUR	100	0	\N	t	2025-11-25 14:57:55.02	2025-11-25 14:57:55.02	\N
on8aap3aicqnw918cphhhymk	nrvc77uqaawbor31e1bx4c9a	qcqlqkex3nowul09kn95mte8	SKU-qcqlqkex3nowul09kn95mte8	59	EUR	100	0	\N	t	2025-11-25 14:57:55.653	2025-11-25 14:57:55.653	\N
gylvk6bo9g97k6djmz2rbl7v	nrvc77uqaawbor31e1bx4c9a	y9g0mglhxipaan0qs7sugfws	SKU-y9g0mglhxipaan0qs7sugfws	173	EUR	100	0	\N	t	2025-11-25 14:57:56.298	2025-11-25 14:57:56.298	\N
slv949qlj6uw4vnb2p4s6c7d	nrvc77uqaawbor31e1bx4c9a	iara8km5z145e3pm4xew3muu	SKU-iara8km5z145e3pm4xew3muu	173	EUR	100	0	\N	t	2025-11-25 14:57:56.932	2025-11-25 14:57:56.932	\N
z19mqucmbcisibcv9k1xkq1z	nrvc77uqaawbor31e1bx4c9a	ig3czruonffm3j7z40wigtjx	SKU-ig3czruonffm3j7z40wigtjx	191	EUR	100	0	\N	t	2025-11-25 14:57:57.569	2025-11-25 14:57:57.569	\N
c0k785vmgwf3vtthns59eydf	nrvc77uqaawbor31e1bx4c9a	wkkppnzuujxpu3wl4l86j0kb	SKU-wkkppnzuujxpu3wl4l86j0kb	137	EUR	100	0	\N	t	2025-11-25 14:57:58.206	2025-11-25 14:57:58.206	\N
cew4v8jzuxrutve8o8ur8bbb	nrvc77uqaawbor31e1bx4c9a	tkyydm6t728v91ggdcebprdy	SKU-tkyydm6t728v91ggdcebprdy	137	EUR	100	0	\N	t	2025-11-25 14:57:58.84	2025-11-25 14:57:58.84	\N
c2s9gdvbeq5cm6rh4hcf0s4n	nrvc77uqaawbor31e1bx4c9a	omb1j4cze4kfjdu3on15jpkp	SKU-omb1j4cze4kfjdu3on15jpkp	137	EUR	100	0	\N	t	2025-11-25 14:57:59.487	2025-11-25 14:57:59.487	\N
yztm0402xkc28xatmtjkgexn	nrvc77uqaawbor31e1bx4c9a	dig7rpdv6px7ba82kqixg97z	SKU-dig7rpdv6px7ba82kqixg97z	1260	EUR	100	0	\N	t	2025-11-25 14:58:00.119	2025-11-25 14:58:00.119	\N
icwjwpwkddvvua2wuxblm8zr	nrvc77uqaawbor31e1bx4c9a	xqauxdgqmjwps7fu16ti9dvf	SKU-xqauxdgqmjwps7fu16ti9dvf	109	EUR	100	0	\N	t	2025-11-25 14:58:00.752	2025-11-25 14:58:00.752	\N
wd1pijv13334m80rqoayk0vn	nrvc77uqaawbor31e1bx4c9a	wgrn7jps8a01p3maw5hklp5q	SKU-wgrn7jps8a01p3maw5hklp5q	1185	EUR	100	0	\N	t	2025-11-25 14:58:01.382	2025-11-25 14:58:01.382	\N
t0npyghqnbxtvu7h96y8e1eo	nrvc77uqaawbor31e1bx4c9a	f9mrl822w0vhr5y20c6prw9x	SKU-f9mrl822w0vhr5y20c6prw9x	1185	EUR	100	0	\N	t	2025-11-25 14:58:02.089	2025-11-25 14:58:02.089	\N
ub58f7zagdbco8ltr8gyng7d	nrvc77uqaawbor31e1bx4c9a	k52gr9k9n4brp6c9aoyj0qyu	SKU-k52gr9k9n4brp6c9aoyj0qyu	1185	EUR	100	0	\N	t	2025-11-25 14:58:02.72	2025-11-25 14:58:02.72	\N
te09k4khs3xcm7kwf4dr3f0v	nrvc77uqaawbor31e1bx4c9a	l4l903hc5xnbish2orjewh6l	SKU-l4l903hc5xnbish2orjewh6l	1185	EUR	100	0	\N	t	2025-11-25 14:58:03.354	2025-11-25 14:58:03.354	\N
xbn22cd2h02owjro9rgbclvd	nrvc77uqaawbor31e1bx4c9a	u0ucjqs60rkt2ido4dv0n50y	SKU-u0ucjqs60rkt2ido4dv0n50y	1740	EUR	100	0	\N	t	2025-11-25 14:58:03.984	2025-11-25 14:58:03.984	\N
fpgxhqgwk3qkud8zxqmy8on3	nrvc77uqaawbor31e1bx4c9a	lvh88dbm1dpe2cg4h2lyx4a9	SKU-lvh88dbm1dpe2cg4h2lyx4a9	1215	EUR	100	0	\N	t	2025-11-25 14:58:04.629	2025-11-25 14:58:04.629	\N
lc4ht3apprt883ty3z2c6mcn	nrvc77uqaawbor31e1bx4c9a	lkc6zijgplie0g2qrh0bgkd0	SKU-lkc6zijgplie0g2qrh0bgkd0	683	EUR	100	0	\N	t	2025-11-25 14:58:05.269	2025-11-25 14:58:05.269	\N
d8ynwmsme3ak3y7blt66givz	nrvc77uqaawbor31e1bx4c9a	uxajzm5vl7rpmr3gfrxfqkpq	SKU-uxajzm5vl7rpmr3gfrxfqkpq	589	EUR	100	0	\N	t	2025-11-25 15:08:17.972	2025-11-25 15:08:17.972	\N
msirkw3o7los36klgwi8d78f	nrvc77uqaawbor31e1bx4c9a	miwiprx9p18godnjajumm5q1	SKU-miwiprx9p18godnjajumm5q1	874	EUR	100	0	\N	t	2025-11-25 15:08:18.609	2025-11-25 15:08:18.609	\N
qrtr2m5s9tezdfr278ss8v29	nrvc77uqaawbor31e1bx4c9a	iie8cxjetgfo628gom9jgkvb	SKU-iie8cxjetgfo628gom9jgkvb	468	EUR	100	0	\N	t	2025-11-25 15:08:19.243	2025-11-25 15:08:19.243	\N
i346m7qq18ch5v9jyp6y0512	nrvc77uqaawbor31e1bx4c9a	qabn7tjd6foaya9rdua1qi1p	SKU-qabn7tjd6foaya9rdua1qi1p	388	EUR	100	0	\N	t	2025-11-25 15:08:19.884	2025-11-25 15:08:19.884	\N
nm1qeb15gobecmyq7kwxvox4	nrvc77uqaawbor31e1bx4c9a	kntx3lpv6fu7b0f33o1zd8k4	SKU-kntx3lpv6fu7b0f33o1zd8k4	857	EUR	100	0	\N	t	2025-11-25 15:08:20.517	2025-11-25 15:08:20.517	\N
xzfg0cb4qi0lkoqlpo550zx5	nrvc77uqaawbor31e1bx4c9a	u7s7efhzwb08m3q1wresr3ih	SKU-u7s7efhzwb08m3q1wresr3ih	589	EUR	100	0	\N	t	2025-11-25 15:08:21.168	2025-11-25 15:08:21.168	\N
orfdacvczpcoxvsfv146km50	nrvc77uqaawbor31e1bx4c9a	cqqbgdd9dlwcre0ylv8nh25m	SKU-cqqbgdd9dlwcre0ylv8nh25m	1041	EUR	100	0	\N	t	2025-11-25 15:08:21.804	2025-11-25 15:08:21.804	\N
z2kgefb840bt8gpdm5sq5jz5	nrvc77uqaawbor31e1bx4c9a	w7xe42i1xr4zjczgsuy7dll2	SKU-w7xe42i1xr4zjczgsuy7dll2	1094	EUR	100	0	\N	t	2025-11-25 15:08:22.442	2025-11-25 15:08:22.442	\N
iach4m6uf5nbkynjud9ya7fh	nrvc77uqaawbor31e1bx4c9a	kineran8dg4cg17xcth0ndf6	SKU-kineran8dg4cg17xcth0ndf6	918	EUR	100	0	\N	t	2025-11-25 15:08:23.074	2025-11-25 15:08:23.074	\N
fl7aka2rmnwuq2sa973yq1dc	nrvc77uqaawbor31e1bx4c9a	mo6zn93dp9bgawuzm937n38t	SKU-mo6zn93dp9bgawuzm937n38t	4420	EUR	100	0	\N	t	2025-11-25 15:08:23.777	2025-11-25 15:08:23.777	\N
rp7hsf5ln4sfjl6fgq6awsqo	nrvc77uqaawbor31e1bx4c9a	y0ukkbg6lvw19p87jgghx2w2	SKU-y0ukkbg6lvw19p87jgghx2w2	1105	EUR	100	0	\N	t	2025-11-25 15:08:24.414	2025-11-25 15:08:24.414	\N
b3tg26kjvfhvs41mf2mj0vyq	nrvc77uqaawbor31e1bx4c9a	k2o3q7vw9zg977sigvp7swab	SKU-k2o3q7vw9zg977sigvp7swab	860	EUR	100	0	\N	t	2025-11-25 15:08:25.049	2025-11-25 15:08:25.049	\N
pf6wjl15whrv50xy6yc60m6u	nrvc77uqaawbor31e1bx4c9a	e4vzugh0sytdz5t9r1d9ad5g	SKU-e4vzugh0sytdz5t9r1d9ad5g	1955	EUR	100	0	\N	t	2025-11-25 15:08:25.687	2025-11-25 15:08:25.687	\N
cz2fbl1x3yl2nxweqa7wuml1	nrvc77uqaawbor31e1bx4c9a	k2oiijoo767vp9r3gemfolg4	SKU-k2oiijoo767vp9r3gemfolg4	969	EUR	100	0	\N	t	2025-11-25 15:08:26.322	2025-11-25 15:08:26.322	\N
a0gzbv8mtwklw1fnzawmikdd	nrvc77uqaawbor31e1bx4c9a	ng20scklgwuzmy62f6m9biz7	SKU-ng20scklgwuzmy62f6m9biz7	772	EUR	100	0	\N	t	2025-11-25 15:08:26.965	2025-11-25 15:08:26.965	\N
pfq2ijpwf2h07un1o6ybwikj	nrvc77uqaawbor31e1bx4c9a	xt2qwviwz2tdbgaoehvfry68	SKU-xt2qwviwz2tdbgaoehvfry68	504	EUR	100	0	\N	t	2025-11-25 15:08:27.598	2025-11-25 15:08:27.598	\N
hxblevmchrxxzz26w8etmkcl	nrvc77uqaawbor31e1bx4c9a	g5kjg3jnlql15anadq2uib8i	SKU-g5kjg3jnlql15anadq2uib8i	66	EUR	65	0	\N	t	2025-11-25 14:54:32.005	2025-12-15 03:16:01.448	\N
xsue9q9hq7dka0ps05dt3d6p	nrvc77uqaawbor31e1bx4c9a	ebv0vaorxyg8qar8h147942k	SKU-ebv0vaorxyg8qar8h147942k	1350	EUR	100	0	\N	t	2025-11-25 14:58:05.907	2025-11-25 14:58:05.907	\N
azlaijqkuyw3uvjvhgqq62cs	nrvc77uqaawbor31e1bx4c9a	sr5dprre7xgkq3cm90tvk3hq	SKU-sr5dprre7xgkq3cm90tvk3hq	1215	EUR	100	0	\N	t	2025-11-25 14:58:06.613	2025-11-25 14:58:06.613	\N
vze2qrz3yenoo0eun3usym35	nrvc77uqaawbor31e1bx4c9a	yim1ldnzey96uhh3cdvitzcv	SKU-yim1ldnzey96uhh3cdvitzcv	825	EUR	100	0	\N	t	2025-11-25 14:58:07.248	2025-11-25 14:58:07.248	\N
u1pkzvp49mycew5kaek0nxty	nrvc77uqaawbor31e1bx4c9a	yxapswjt7t7m6vjvcc6chsil	SKU-yxapswjt7t7m6vjvcc6chsil	915	EUR	100	0	\N	t	2025-11-25 14:58:07.88	2025-11-25 14:58:07.88	\N
yo23c6orn3ogtljt8yokp4dr	nrvc77uqaawbor31e1bx4c9a	mzxunmpyi59ijbzc7ptas3tx	SKU-mzxunmpyi59ijbzc7ptas3tx	1125	EUR	100	0	\N	t	2025-11-25 14:58:08.515	2025-11-25 14:58:08.515	\N
e8xobdfs5dw5o0ker3d1wf1m	nrvc77uqaawbor31e1bx4c9a	vsuh74ad5z5084rtccagntw1	SKU-vsuh74ad5z5084rtccagntw1	570	EUR	100	0	\N	t	2025-11-25 14:58:09.152	2025-11-25 14:58:09.152	\N
h32ns2la988e6y2o46zkq9gs	nrvc77uqaawbor31e1bx4c9a	rd5qi48d9czxahmb5azyihr2	SKU-rd5qi48d9czxahmb5azyihr2	608	EUR	100	0	\N	t	2025-11-25 14:58:09.786	2025-11-25 14:58:09.786	\N
jp9aitin1i5yoid07uyje7nx	nrvc77uqaawbor31e1bx4c9a	wbijtwbh0uqqeupvsnnb6swc	SKU-wbijtwbh0uqqeupvsnnb6swc	1260	EUR	100	0	\N	t	2025-11-25 14:58:10.422	2025-11-25 14:58:10.422	\N
mspfqllacilfw155pyumzqej	nrvc77uqaawbor31e1bx4c9a	jvyrsu0fryedl64dnq87e9yv	SKU-jvyrsu0fryedl64dnq87e9yv	5475	EUR	100	0	\N	t	2025-11-25 14:58:11.056	2025-11-25 14:58:11.056	\N
a5zyj2q8yz5ce5x1ygl2juug	nrvc77uqaawbor31e1bx4c9a	rji5c7n41887js5wcb6jzzab	SKU-rji5c7n41887js5wcb6jzzab	1838	EUR	100	0	\N	t	2025-11-25 14:58:11.689	2025-11-25 14:58:11.689	\N
an5vpk4svapoa09e3bj1yqze	nrvc77uqaawbor31e1bx4c9a	rtlca3e491irwo9zaex1jzb9	SKU-rtlca3e491irwo9zaex1jzb9	1163	EUR	100	0	\N	t	2025-11-25 14:58:12.322	2025-11-25 14:58:12.322	\N
igdodje0vxz47gfcp3l0w9z6	nrvc77uqaawbor31e1bx4c9a	z6anqk1vrynu5yipdqu5s1hw	SKU-z6anqk1vrynu5yipdqu5s1hw	1373	EUR	100	0	\N	t	2025-11-25 14:58:12.96	2025-11-25 14:58:12.96	\N
kckmk2h3wzhoqrlltn6yowid	nrvc77uqaawbor31e1bx4c9a	fwjlxh39npms9t3ftc5qouym	SKU-fwjlxh39npms9t3ftc5qouym	1710	EUR	100	0	\N	t	2025-11-25 14:58:13.685	2025-11-25 14:58:13.685	\N
vynq6hedyh7hopbyxr098368	nrvc77uqaawbor31e1bx4c9a	pz9tazh3fow9khtf29hzt9ja	SKU-pz9tazh3fow9khtf29hzt9ja	975	EUR	100	0	\N	t	2025-11-25 14:58:14.329	2025-11-25 14:58:14.329	\N
k4gu99jjzgsnzcrucj7tiudp	nrvc77uqaawbor31e1bx4c9a	yvbarcd0hlatju8x5ncpcqs5	SKU-yvbarcd0hlatju8x5ncpcqs5	848	EUR	100	0	\N	t	2025-11-25 14:58:14.963	2025-11-25 14:58:14.963	\N
y12g1923562rd4tdp67fnsr4	nrvc77uqaawbor31e1bx4c9a	pehb1wwjyxqtkqgda89443r9	SKU-pehb1wwjyxqtkqgda89443r9	1200	EUR	100	0	\N	t	2025-11-25 14:58:15.611	2025-11-25 14:58:15.611	\N
ce8le94akugro1wn1c7c8o58	nrvc77uqaawbor31e1bx4c9a	f4zizodq170w7aupizlnfd8b	SKU-f4zizodq170w7aupizlnfd8b	1575	EUR	100	0	\N	t	2025-11-25 14:58:16.242	2025-11-25 14:58:16.242	\N
i9kbfmun8xreegkfocixlh8i	nrvc77uqaawbor31e1bx4c9a	p1gctvuzk7qceqqc770pjiqv	SKU-p1gctvuzk7qceqqc770pjiqv	1253	EUR	100	0	\N	t	2025-11-25 14:58:16.874	2025-11-25 14:58:16.874	\N
vn5ruq10wbv2039ox2ay21oe	nrvc77uqaawbor31e1bx4c9a	c05cxb0a9x7g1huglw94tsq1	SKU-c05cxb0a9x7g1huglw94tsq1	1125	EUR	100	0	\N	t	2025-11-25 14:58:17.57	2025-11-25 14:58:17.57	\N
n3518r5u7pxwonmdkmeg9jw7	nrvc77uqaawbor31e1bx4c9a	d4ovhznjruh35q5s3smd1b9d	SKU-d4ovhznjruh35q5s3smd1b9d	769	EUR	100	0	\N	t	2025-11-25 14:58:18.223	2025-11-25 14:58:18.223	\N
jeii8cxvr3sg7k8sl5cezjhx	nrvc77uqaawbor31e1bx4c9a	f8i4gdw5t3eia0xvq7f8eefe	SKU-f8i4gdw5t3eia0xvq7f8eefe	2310	EUR	100	0	\N	t	2025-11-25 14:58:18.864	2025-11-25 14:58:18.864	\N
avgeuhm2rzyg4j1estvngss7	nrvc77uqaawbor31e1bx4c9a	b62lessttwyp6mmf4flct8sy	SKU-b62lessttwyp6mmf4flct8sy	1020	EUR	100	0	\N	t	2025-11-25 14:58:19.494	2025-11-25 14:58:19.494	\N
jsjjom0hc4onvx2lsr5ipr0t	nrvc77uqaawbor31e1bx4c9a	mcuuufm80521kmg4cxje9t8j	SKU-mcuuufm80521kmg4cxje9t8j	975	EUR	100	0	\N	t	2025-11-25 14:58:20.153	2025-11-25 14:58:20.153	\N
jsxorn1x7z2kkydsjna65t1e	nrvc77uqaawbor31e1bx4c9a	kd6cogvqxiv1y7lqqb9up579	SKU-kd6cogvqxiv1y7lqqb9up579	975	EUR	100	0	\N	t	2025-11-25 14:58:20.784	2025-11-25 14:58:20.784	\N
qcru7ttsvlrkn9wgcanhjnmm	nrvc77uqaawbor31e1bx4c9a	sjv1cc5nf6xq9f9dbe7a13hh	SKU-sjv1cc5nf6xq9f9dbe7a13hh	1500	EUR	100	0	\N	t	2025-11-25 14:58:21.422	2025-11-25 14:58:21.422	\N
i61p92truv7pllsyzju2338w	nrvc77uqaawbor31e1bx4c9a	xijgrjr8lkux49yv8rfxintz	SKU-xijgrjr8lkux49yv8rfxintz	13875	EUR	100	0	\N	t	2025-11-25 14:58:22.123	2025-11-25 14:58:22.123	\N
ymknmyem4lc4vimp9m1lci6b	nrvc77uqaawbor31e1bx4c9a	wjwvt7b4lbqy7u4mjc1r169c	SKU-wjwvt7b4lbqy7u4mjc1r169c	1823	EUR	100	0	\N	t	2025-11-25 14:58:22.754	2025-11-25 14:58:22.754	\N
jeihtg1lxfgbul43y8rcejh1	nrvc77uqaawbor31e1bx4c9a	lfp1ypaojcvb0fggbvzfz4qq	SKU-lfp1ypaojcvb0fggbvzfz4qq	2400	EUR	100	0	\N	t	2025-11-25 14:58:23.386	2025-11-25 14:58:23.386	\N
tw6qah27cx8rys01oyo8n3i5	nrvc77uqaawbor31e1bx4c9a	hma6eudjhglhgfmld0jupnsp	SKU-hma6eudjhglhgfmld0jupnsp	2400	EUR	100	0	\N	t	2025-11-25 14:58:24.016	2025-11-25 14:58:24.016	\N
diut88ign426l936vw29tfw1	nrvc77uqaawbor31e1bx4c9a	jr8wepxr7j25fvuxlc946pef	SKU-jr8wepxr7j25fvuxlc946pef	2400	EUR	100	0	\N	t	2025-11-25 14:58:24.65	2025-11-25 14:58:24.65	\N
kqimaxu866qk7o9s6n84y6o5	nrvc77uqaawbor31e1bx4c9a	hvxqjva7mgsxg712bc4dw9xd	SKU-hvxqjva7mgsxg712bc4dw9xd	2820	EUR	100	0	\N	t	2025-11-25 14:58:25.29	2025-11-25 14:58:25.29	\N
mokbhdp81srcl34rgmfo67rc	nrvc77uqaawbor31e1bx4c9a	hex765zwm9sgdl9yxrty6zr8	SKU-hex765zwm9sgdl9yxrty6zr8	2550	EUR	100	0	\N	t	2025-11-25 14:58:25.925	2025-11-25 14:58:25.925	\N
izfe3mjpwkky999oamxhgk9i	nrvc77uqaawbor31e1bx4c9a	l1ab0qu2cn3zy65np7539lw7	SKU-l1ab0qu2cn3zy65np7539lw7	2220	EUR	100	0	\N	t	2025-11-25 14:58:26.606	2025-11-25 14:58:26.606	\N
fax5v35fem0txr3au9pf3wux	nrvc77uqaawbor31e1bx4c9a	xmhx4v9llk235nhn9pp44sq6	SKU-xmhx4v9llk235nhn9pp44sq6	2078	EUR	100	0	\N	t	2025-11-25 14:58:27.245	2025-11-25 14:58:27.245	\N
n4h9erwlmpenjc8oyyckhr3u	nrvc77uqaawbor31e1bx4c9a	n1uvo1n5skuoupdunl16i5st	SKU-n1uvo1n5skuoupdunl16i5st	1800	EUR	100	0	\N	t	2025-11-25 14:58:27.877	2025-11-25 14:58:27.877	\N
w2qny0wt370gmsmsww11d1z1	nrvc77uqaawbor31e1bx4c9a	fav3odppqmoujdfwj946gfds	SKU-fav3odppqmoujdfwj946gfds	8250	EUR	100	0	\N	t	2025-11-25 14:58:28.55	2025-11-25 14:58:28.55	\N
k5lluxo1tkypuhrzl2i9dii6	nrvc77uqaawbor31e1bx4c9a	uea15bbk47bqpv88cntsfapw	SKU-uea15bbk47bqpv88cntsfapw	1725	EUR	100	0	\N	t	2025-11-25 14:58:29.192	2025-11-25 14:58:29.192	\N
ujycjoph7gb3lghultl8a4wp	nrvc77uqaawbor31e1bx4c9a	fcm9o7ytd8s8jq36cl0d1usu	SKU-fcm9o7ytd8s8jq36cl0d1usu	1725	EUR	100	0	\N	t	2025-11-25 14:58:29.832	2025-11-25 14:58:29.832	\N
dobev71v6u1zqge03aue6c0m	nrvc77uqaawbor31e1bx4c9a	qqeu58mful3a6v2k4imelnbe	SKU-qqeu58mful3a6v2k4imelnbe	1853	EUR	100	0	\N	t	2025-11-25 14:58:30.47	2025-11-25 14:58:30.47	\N
jlvr3ydd7sk3mwy5wkhcm2o0	nrvc77uqaawbor31e1bx4c9a	eh14pr754epunqf6uc6nyic4	SKU-eh14pr754epunqf6uc6nyic4	1965	EUR	100	0	\N	t	2025-11-25 14:58:31.164	2025-11-25 14:58:31.164	\N
mrih9kq5tk5y5817i3a8p755	nrvc77uqaawbor31e1bx4c9a	zdltsfk1x25eh5110d7uw34m	SKU-zdltsfk1x25eh5110d7uw34m	1778	EUR	100	0	\N	t	2025-11-25 14:58:31.799	2025-11-25 14:58:31.799	\N
vvy9w0zzyxk3rkzxqiweut7o	nrvc77uqaawbor31e1bx4c9a	vbfm6dti9lchy1ksjra4v6w0	SKU-vbfm6dti9lchy1ksjra4v6w0	2213	EUR	100	0	\N	t	2025-11-25 14:58:32.436	2025-11-25 14:58:32.436	\N
fn62vqi999xu30jrmlohnolt	nrvc77uqaawbor31e1bx4c9a	fxx7wapvr8wyfnw7qcmikkbm	SKU-fxx7wapvr8wyfnw7qcmikkbm	1688	EUR	100	0	\N	t	2025-11-25 14:58:33.1	2025-11-25 14:58:33.1	\N
aqnm5x6sz68phzdkpfikn2qj	nrvc77uqaawbor31e1bx4c9a	pa6bl315ugjumh8yi4rzvied	SKU-pa6bl315ugjumh8yi4rzvied	1695	EUR	100	0	\N	t	2025-11-25 14:58:33.734	2025-11-25 14:58:33.734	\N
ztvrdtro5bcl6vto35d0v53h	nrvc77uqaawbor31e1bx4c9a	vv0ulqo75rs1z2ec414o4u1n	SKU-vv0ulqo75rs1z2ec414o4u1n	2490	EUR	100	0	\N	t	2025-11-25 14:58:34.385	2025-11-25 14:58:34.385	\N
r03g1v81lspq19071ofl6bhn	nrvc77uqaawbor31e1bx4c9a	ox0zc8wfhrv1y1rbwuqdbbwa	SKU-ox0zc8wfhrv1y1rbwuqdbbwa	2565	EUR	100	0	\N	t	2025-11-25 14:58:35.017	2025-11-25 14:58:35.017	\N
dxtbdmna6a5rgk6392by4h0i	nrvc77uqaawbor31e1bx4c9a	cjelmc2greblibyuiznk2htb	SKU-cjelmc2greblibyuiznk2htb	1185	EUR	100	0	\N	t	2025-11-25 14:58:35.653	2025-11-25 14:58:35.653	\N
af2k8n6pbcoisyuogapu93c6	nrvc77uqaawbor31e1bx4c9a	lbnbu7pgpyk828uol3z14mmo	SKU-lbnbu7pgpyk828uol3z14mmo	900	EUR	100	0	\N	t	2025-11-25 14:58:36.288	2025-11-25 14:58:36.288	\N
qqt2hyo42n8sf6xq39geltpm	nrvc77uqaawbor31e1bx4c9a	t5a6oz0v9f9mu2p6v16aeb0k	SKU-t5a6oz0v9f9mu2p6v16aeb0k	1178	EUR	100	0	\N	t	2025-11-25 14:58:36.989	2025-11-25 14:58:36.989	\N
umm1vl401b92u0fu4oj0vawl	nrvc77uqaawbor31e1bx4c9a	pggo0n0d28q3p6slum30a4om	SKU-pggo0n0d28q3p6slum30a4om	1500	EUR	100	0	\N	t	2025-11-25 14:58:37.632	2025-11-25 14:58:37.632	\N
zxn91wbq94i0g4hhu5q3ivft	nrvc77uqaawbor31e1bx4c9a	bru1fu1c4i9dekc6ayhjn1x2	SKU-bru1fu1c4i9dekc6ayhjn1x2	2070	EUR	100	0	\N	t	2025-11-25 14:58:38.284	2025-11-25 14:58:38.284	\N
cgs0ydnerjh6n2uhzn6e6vkx	nrvc77uqaawbor31e1bx4c9a	i6zjzic297wqr87ck3xlfwlq	SKU-i6zjzic297wqr87ck3xlfwlq	2610	EUR	100	0	\N	t	2025-11-25 14:58:38.92	2025-11-25 14:58:38.92	\N
zgggpgz2wxag6r4xu2y7ngmm	nrvc77uqaawbor31e1bx4c9a	yqbeqp6u5rdbuvckiooom007	SKU-yqbeqp6u5rdbuvckiooom007	2670	EUR	100	0	\N	t	2025-11-25 14:58:39.554	2025-11-25 14:58:39.554	\N
u24s8jg768i6wj821asck2ts	nrvc77uqaawbor31e1bx4c9a	d6scvf4py39pgvd8tjyx6fkb	SKU-d6scvf4py39pgvd8tjyx6fkb	1613	EUR	100	0	\N	t	2025-11-25 14:58:40.189	2025-11-25 14:58:40.189	\N
t7exu9nalxpuhywoipjc2nz6	nrvc77uqaawbor31e1bx4c9a	m0yvr54it3jp8m5to2sa5mrh	SKU-m0yvr54it3jp8m5to2sa5mrh	3300	EUR	100	0	\N	t	2025-11-25 14:58:40.837	2025-11-25 14:58:40.837	\N
w6nulwjtl2bij05802vhut6u	nrvc77uqaawbor31e1bx4c9a	vs9gufwrf3zci70x09594oiz	SKU-vs9gufwrf3zci70x09594oiz	1725	EUR	100	0	\N	t	2025-11-25 14:58:41.483	2025-11-25 14:58:41.483	\N
cw0conw5r0gs6mbc3kdhx8ro	nrvc77uqaawbor31e1bx4c9a	u7zlvdl3xo37v372pb1bzxzp	SKU-u7zlvdl3xo37v372pb1bzxzp	1538	EUR	100	0	\N	t	2025-11-25 14:58:42.124	2025-11-25 14:58:42.124	\N
qwnwtpob12igu5wst24z5nlc	nrvc77uqaawbor31e1bx4c9a	r6ahnj19c9lvfp8nbikuu218	SKU-r6ahnj19c9lvfp8nbikuu218	2633	EUR	100	0	\N	t	2025-11-25 14:58:42.773	2025-11-25 14:58:42.773	\N
ikkxtocczs5vx9iexpagehqo	nrvc77uqaawbor31e1bx4c9a	jaaiz7moi8vpouay0w0zr2m0	SKU-jaaiz7moi8vpouay0w0zr2m0	1395	EUR	100	0	\N	t	2025-11-25 14:58:43.404	2025-11-25 14:58:43.404	\N
d8xwps423qrlsx0ur69563az	nrvc77uqaawbor31e1bx4c9a	yn1ajmxqgxil7ch755ops67a	SKU-yn1ajmxqgxil7ch755ops67a	2445	EUR	100	0	\N	t	2025-11-25 14:58:44.049	2025-11-25 14:58:44.049	\N
j7lf5htkl9xctibymdna6c2v	nrvc77uqaawbor31e1bx4c9a	orucky3nqmd87byskq1f5mmw	SKU-orucky3nqmd87byskq1f5mmw	938	EUR	100	0	\N	t	2025-11-25 14:58:44.727	2025-11-25 14:58:44.727	\N
s70i7gd7cp35gy2r35le86p9	nrvc77uqaawbor31e1bx4c9a	s1hkqfhvtip04itbi2wu4wie	SKU-s1hkqfhvtip04itbi2wu4wie	1463	EUR	100	0	\N	t	2025-11-25 14:58:45.358	2025-11-25 14:58:45.358	\N
vmz7k2aosc3b3vl38hty8v7v	nrvc77uqaawbor31e1bx4c9a	yub9wcqgoiv5y7a4alp43hxn	SKU-yub9wcqgoiv5y7a4alp43hxn	1395	EUR	100	0	\N	t	2025-11-25 14:58:45.993	2025-11-25 14:58:45.993	\N
as0nebu5hmpmgb75iwzghq44	nrvc77uqaawbor31e1bx4c9a	xrit9gwrrihz0fe3uovpxbar	SKU-xrit9gwrrihz0fe3uovpxbar	1388	EUR	100	0	\N	t	2025-11-25 14:58:46.631	2025-11-25 14:58:46.631	\N
bvpvuyninmegyvn751qrmnzq	nrvc77uqaawbor31e1bx4c9a	qg44oc5ifsaf0sqc0xzksaq9	SKU-qg44oc5ifsaf0sqc0xzksaq9	1463	EUR	100	0	\N	t	2025-11-25 14:58:47.27	2025-11-25 14:58:47.27	\N
nxdxwjzxs1i5nkehjc4ammho	nrvc77uqaawbor31e1bx4c9a	vq71a9v3yjnvh434ev5x52r2	SKU-vq71a9v3yjnvh434ev5x52r2	1635	EUR	100	0	\N	t	2025-11-25 14:58:47.91	2025-11-25 14:58:47.91	\N
eeg63ybyhon4xt18soi1gm95	nrvc77uqaawbor31e1bx4c9a	ujkxn1yks1n4vuojhd6bxlcc	SKU-ujkxn1yks1n4vuojhd6bxlcc	1913	EUR	100	0	\N	t	2025-11-25 14:58:48.552	2025-11-25 14:58:48.552	\N
dmprsjnrtf8b9slidf78n4ye	nrvc77uqaawbor31e1bx4c9a	i39jtl84fz0fbyt4lqd6mn8h	SKU-i39jtl84fz0fbyt4lqd6mn8h	1538	EUR	100	0	\N	t	2025-11-25 14:58:49.192	2025-11-25 14:58:49.192	\N
h2f4ixnb76i9xpaywhvhxnq4	nrvc77uqaawbor31e1bx4c9a	fn2qxxgctdfnbiwjcqloppez	SKU-fn2qxxgctdfnbiwjcqloppez	1748	EUR	100	0	\N	t	2025-11-25 14:58:49.828	2025-11-25 14:58:49.828	\N
g1jobgeeuzws1mzhzkphgu7h	nrvc77uqaawbor31e1bx4c9a	mlbkg8bqd7k3j3gmw61pi55y	SKU-mlbkg8bqd7k3j3gmw61pi55y	2430	EUR	100	0	\N	t	2025-11-25 14:58:50.461	2025-11-25 14:58:50.461	\N
d8pvuzpdj7tcl6whco4r2dhf	nrvc77uqaawbor31e1bx4c9a	sp4n5rol9x4ppwstd0609xyk	SKU-sp4n5rol9x4ppwstd0609xyk	1950	EUR	100	0	\N	t	2025-11-25 14:58:51.103	2025-11-25 14:58:51.103	\N
ner7decg9owzor9g7ct4fib3	nrvc77uqaawbor31e1bx4c9a	xq76ax6g4kiq563srja9i4w9	SKU-xq76ax6g4kiq563srja9i4w9	2850	EUR	100	0	\N	t	2025-11-25 14:58:51.738	2025-11-25 14:58:51.738	\N
x1831vhaoodd4x9rsvuzzfwy	nrvc77uqaawbor31e1bx4c9a	wbdykgosmybhs0h17iigg3js	SKU-wbdykgosmybhs0h17iigg3js	1793	EUR	100	0	\N	t	2025-11-25 14:58:52.444	2025-11-25 14:58:52.444	\N
qso3dm0tjv1rdu65mf84u8e7	nrvc77uqaawbor31e1bx4c9a	mjvrte2u138v9k18upbq5j85	SKU-mjvrte2u138v9k18upbq5j85	1050	EUR	100	0	\N	t	2025-11-25 14:58:53.081	2025-11-25 14:58:53.081	\N
gi152waa9tkva6dion0zlkse	nrvc77uqaawbor31e1bx4c9a	wojuux7zckkrszb5ifha8epi	SKU-wojuux7zckkrszb5ifha8epi	1538	EUR	100	0	\N	t	2025-11-25 14:58:53.714	2025-11-25 14:58:53.714	\N
yy9wcyweeg1zx5wouh7z8ijl	nrvc77uqaawbor31e1bx4c9a	o5qlf5xgrptnq2ijl78tdnal	SKU-o5qlf5xgrptnq2ijl78tdnal	1275	EUR	100	0	\N	t	2025-11-25 14:58:54.354	2025-11-25 14:58:54.354	\N
zsviu98sx1dtyt1p381k4w8j	nrvc77uqaawbor31e1bx4c9a	csc74q2g7xm7iank95t65qaj	SKU-csc74q2g7xm7iank95t65qaj	788	EUR	100	0	\N	t	2025-11-25 14:58:54.991	2025-11-25 14:58:54.991	\N
mwecc90lfbbdc6a3mcbwwod8	nrvc77uqaawbor31e1bx4c9a	wu0w549v85vo1fd30jrgexdb	SKU-wu0w549v85vo1fd30jrgexdb	1155	EUR	100	0	\N	t	2025-11-25 14:58:55.635	2025-11-25 14:58:55.635	\N
gtu7yt472qbrdmcwwwhwoqc8	nrvc77uqaawbor31e1bx4c9a	asbs9vbqrr19x1ou2v3e2xpv	SKU-asbs9vbqrr19x1ou2v3e2xpv	1350	EUR	100	0	\N	t	2025-11-25 14:58:56.268	2025-11-25 14:58:56.268	\N
obzk3edcrgxt4x0lak217ztn	nrvc77uqaawbor31e1bx4c9a	rcbmv2e580dv81teaj5oqb9e	SKU-rcbmv2e580dv81teaj5oqb9e	1485	EUR	100	0	\N	t	2025-11-25 14:58:56.912	2025-11-25 14:58:56.912	\N
j9lcizspmfa6mjwflq0m6ecv	nrvc77uqaawbor31e1bx4c9a	za2fkwusjcq4bj2zq28q02r7	SKU-za2fkwusjcq4bj2zq28q02r7	4650	EUR	100	0	\N	t	2025-11-25 14:58:57.555	2025-11-25 14:58:57.555	\N
o89cov6unxgd0wlpnm0agtql	nrvc77uqaawbor31e1bx4c9a	i1ltohob26yctls1tipzsc1o	SKU-i1ltohob26yctls1tipzsc1o	3615	EUR	100	0	\N	t	2025-11-25 14:58:58.197	2025-11-25 14:58:58.197	\N
yt22s3wuldnhazpc9dre0mql	nrvc77uqaawbor31e1bx4c9a	tawr98uaux6h373ya9bjzwzr	SKU-tawr98uaux6h373ya9bjzwzr	3150	EUR	100	0	\N	t	2025-11-25 14:58:58.833	2025-11-25 14:58:58.833	\N
f88z0rvx2n13v0oaewgy1ee1	nrvc77uqaawbor31e1bx4c9a	unxr5lcs6quk7fys23zd9uut	SKU-unxr5lcs6quk7fys23zd9uut	2775	EUR	100	0	\N	t	2025-11-25 14:58:59.469	2025-11-25 14:58:59.469	\N
fqk3vnch7puw1ph519w0cpdq	nrvc77uqaawbor31e1bx4c9a	ckyxf74fki7u5kvpkfkszfxx	SKU-ckyxf74fki7u5kvpkfkszfxx	5265	EUR	100	0	\N	t	2025-11-25 14:59:00.103	2025-11-25 14:59:00.103	\N
qof90u4hshmm85hiu3f8cf8d	nrvc77uqaawbor31e1bx4c9a	f23sx0kmhj6bnvwbvfjsjkrh	SKU-f23sx0kmhj6bnvwbvfjsjkrh	1913	EUR	100	0	\N	t	2025-11-25 14:59:00.737	2025-11-25 14:59:00.737	\N
ym27acyiuxifhh4q9fee3es1	nrvc77uqaawbor31e1bx4c9a	prrg85ix2y92dctgi1h772t3	SKU-prrg85ix2y92dctgi1h772t3	2700	EUR	100	0	\N	t	2025-11-25 14:59:01.379	2025-11-25 14:59:01.379	\N
rjh1ttomuj3ndat28jm2x6vg	nrvc77uqaawbor31e1bx4c9a	rr3jld6m4061kzf18iaqx3vd	SKU-rr3jld6m4061kzf18iaqx3vd	3038	EUR	100	0	\N	t	2025-11-25 14:59:02.02	2025-11-25 14:59:02.02	\N
q0vgh4thlk9i7528lcba4qd9	nrvc77uqaawbor31e1bx4c9a	yt2ukynnwuhuw2s3d9j3d2x3	SKU-yt2ukynnwuhuw2s3d9j3d2x3	1275	EUR	100	0	\N	t	2025-11-25 14:59:02.658	2025-11-25 14:59:02.658	\N
erxnhh6sea9jblq3dm92cil4	nrvc77uqaawbor31e1bx4c9a	oica3gjy08sbh2rp97wm4rzi	SKU-oica3gjy08sbh2rp97wm4rzi	1628	EUR	100	0	\N	t	2025-11-25 14:59:03.291	2025-11-25 14:59:03.291	\N
j4bawapboydi2frrfm8175kv	nrvc77uqaawbor31e1bx4c9a	w2u50nb803b7gmf1f8hauvts	SKU-w2u50nb803b7gmf1f8hauvts	863	EUR	100	0	\N	t	2025-11-25 14:59:03.933	2025-11-25 14:59:03.933	\N
trnk56ednu9j1eayv1ir911z	nrvc77uqaawbor31e1bx4c9a	vtawgitmolwrym54rlvgsofi	SKU-vtawgitmolwrym54rlvgsofi	1710	EUR	100	0	\N	t	2025-11-25 14:59:04.569	2025-11-25 14:59:04.569	\N
axgqu3eeqrn9mja1o1swuhr0	nrvc77uqaawbor31e1bx4c9a	c3kaxwoot8ljgn9diojtz7i7	SKU-c3kaxwoot8ljgn9diojtz7i7	1860	EUR	100	0	\N	t	2025-11-25 14:59:05.216	2025-11-25 14:59:05.216	\N
s0trakbqsrh50vgc6ltwv5yk	nrvc77uqaawbor31e1bx4c9a	w5bjykoe5hb4ps6ltz35e4ti	SKU-w5bjykoe5hb4ps6ltz35e4ti	2663	EUR	100	0	\N	t	2025-11-25 14:59:05.855	2025-11-25 14:59:05.855	\N
z1ic885myr5euh52vetfnr5r	nrvc77uqaawbor31e1bx4c9a	k2r1c855j7xc4q687v4f2r1w	SKU-k2r1c855j7xc4q687v4f2r1w	2723	EUR	100	0	\N	t	2025-11-25 14:59:06.496	2025-11-25 14:59:06.496	\N
yhw6akjnicy9n8531b3ozw74	nrvc77uqaawbor31e1bx4c9a	hnja0289rpac3u36rv0xbd42	SKU-hnja0289rpac3u36rv0xbd42	2723	EUR	100	0	\N	t	2025-11-25 14:59:07.2	2025-11-25 14:59:07.2	\N
q9ld2ftq6oba5bb3h3ctpo7p	nrvc77uqaawbor31e1bx4c9a	aod1rq4of6fxdgj970ohw9r2	SKU-aod1rq4of6fxdgj970ohw9r2	2505	EUR	100	0	\N	t	2025-11-25 14:59:07.833	2025-11-25 14:59:07.833	\N
smx2tupxfpbpkno8g8o8igvi	nrvc77uqaawbor31e1bx4c9a	q995sljxr5vuu1qivdn2o01f	SKU-q995sljxr5vuu1qivdn2o01f	2723	EUR	100	0	\N	t	2025-11-25 14:59:08.475	2025-11-25 14:59:08.475	\N
fb8wm4nsvvtjtikkddxm0rbd	nrvc77uqaawbor31e1bx4c9a	b9vspcq6btluj9xfmqgkr3hh	SKU-b9vspcq6btluj9xfmqgkr3hh	3150	EUR	100	0	\N	t	2025-11-25 14:59:09.11	2025-11-25 14:59:09.11	\N
tv9llwosd3r7kx8zeqj661fr	nrvc77uqaawbor31e1bx4c9a	sieq1a5naf1dmjnv7a66ranh	SKU-sieq1a5naf1dmjnv7a66ranh	2400	EUR	100	0	\N	t	2025-11-25 14:59:09.746	2025-11-25 14:59:09.746	\N
yebj7sd82m4j6foywe0j9g8h	nrvc77uqaawbor31e1bx4c9a	uq6bsgdu36blrys2z48bpuz0	SKU-uq6bsgdu36blrys2z48bpuz0	3885	EUR	100	0	\N	t	2025-11-25 14:59:10.38	2025-11-25 14:59:10.38	\N
vv9b6olh6wt6hzfhonmz9dsi	nrvc77uqaawbor31e1bx4c9a	g2zylfakp2k3lt7ymbvd8hkp	SKU-g2zylfakp2k3lt7ymbvd8hkp	2640	EUR	100	0	\N	t	2025-11-25 14:59:11.02	2025-11-25 14:59:11.02	\N
brhg99cvzaxgl13be2b5jbt4	nrvc77uqaawbor31e1bx4c9a	gqxa0qf0uekrxvjnxa72kyxr	SKU-gqxa0qf0uekrxvjnxa72kyxr	5558	EUR	100	0	\N	t	2025-11-25 14:59:11.653	2025-11-25 14:59:11.653	\N
fguf6bmjtcds5trnbj3cyhzw	nrvc77uqaawbor31e1bx4c9a	oajpwlwhamn01ipzd65j23db	SKU-oajpwlwhamn01ipzd65j23db	5558	EUR	100	0	\N	t	2025-11-25 14:59:12.29	2025-11-25 14:59:12.29	\N
rdrw54235wxkkfm3tosx1fhc	nrvc77uqaawbor31e1bx4c9a	e20n40dfec5fsmpn3d4vteqm	SKU-e20n40dfec5fsmpn3d4vteqm	5558	EUR	100	0	\N	t	2025-11-25 14:59:12.936	2025-11-25 14:59:12.936	\N
fhqtu5an43b9do21l60zvods	nrvc77uqaawbor31e1bx4c9a	tdsbkvlbrhs18gfbjuhlii70	SKU-tdsbkvlbrhs18gfbjuhlii70	5558	EUR	100	0	\N	t	2025-11-25 14:59:13.569	2025-11-25 14:59:13.569	\N
hw0f8nswmpo1pmsleij60jqo	nrvc77uqaawbor31e1bx4c9a	j56nzqn2bypuwo24154kqmh1	SKU-j56nzqn2bypuwo24154kqmh1	5558	EUR	100	0	\N	t	2025-11-25 14:59:14.205	2025-11-25 14:59:14.205	\N
ieh0dbj896yq7px3ufd2n236	nrvc77uqaawbor31e1bx4c9a	tkeivuvv5q9lad5ywgrwvz4m	SKU-tkeivuvv5q9lad5ywgrwvz4m	5558	EUR	100	0	\N	t	2025-11-25 14:59:14.927	2025-11-25 14:59:14.927	\N
xy8ehb6oh276okze8qogs7te	nrvc77uqaawbor31e1bx4c9a	km4xjs9x18fdwn8c8cnxd99j	SKU-km4xjs9x18fdwn8c8cnxd99j	5558	EUR	100	0	\N	t	2025-11-25 14:59:15.584	2025-11-25 14:59:15.584	\N
b4c1bxgi6v6rfgtbhf36jbj2	nrvc77uqaawbor31e1bx4c9a	u8p64qfro75n7p5ms95g8zk9	SKU-u8p64qfro75n7p5ms95g8zk9	2805	EUR	100	0	\N	t	2025-11-25 14:59:16.24	2025-11-25 14:59:16.24	\N
bzfda8hxfz9e3tabhwylplzz	nrvc77uqaawbor31e1bx4c9a	ytl4nam8twz679kj7303fj05	SKU-ytl4nam8twz679kj7303fj05	6413	EUR	100	0	\N	t	2025-11-25 14:59:16.879	2025-11-25 14:59:16.879	\N
gffeat6uvgan7jvr8p1haggz	nrvc77uqaawbor31e1bx4c9a	q7ricq6t5uf0i5g88fccbyz2	SKU-q7ricq6t5uf0i5g88fccbyz2	3030	EUR	100	0	\N	t	2025-11-25 14:59:17.514	2025-11-25 14:59:17.514	\N
os7y662a5ghw1hpmt9uhse5n	nrvc77uqaawbor31e1bx4c9a	zrq2wyasyhq0zpdbs3kuta3s	SKU-zrq2wyasyhq0zpdbs3kuta3s	2288	EUR	100	0	\N	t	2025-11-25 14:59:18.15	2025-11-25 14:59:18.15	\N
d7aaiu4ztan5ge5xwgoa5rwv	nrvc77uqaawbor31e1bx4c9a	vu9en93o93xd59tiw2lnlx3u	SKU-vu9en93o93xd59tiw2lnlx3u	1800	EUR	100	0	\N	t	2025-11-25 14:59:18.789	2025-11-25 14:59:18.789	\N
xnubpspkqu6m8dwfkp00kezp	nrvc77uqaawbor31e1bx4c9a	ws1j4q20sck69em1uv0d9yt3	SKU-ws1j4q20sck69em1uv0d9yt3	1260	EUR	100	0	\N	t	2025-11-25 14:59:19.425	2025-11-25 14:59:19.425	\N
bi1s3rd3ey221eiv6qx598wd	nrvc77uqaawbor31e1bx4c9a	eawg1n2f8r3wcxppuaqopn48	SKU-eawg1n2f8r3wcxppuaqopn48	1268	EUR	100	0	\N	t	2025-11-25 14:59:20.06	2025-11-25 14:59:20.06	\N
g03ix1u6x6z7njlw7o6gm3zo	nrvc77uqaawbor31e1bx4c9a	l1y3j9ij0q74iaws4sifbtza	SKU-l1y3j9ij0q74iaws4sifbtza	1643	EUR	100	0	\N	t	2025-11-25 14:59:20.712	2025-11-25 14:59:20.712	\N
vi7doyi9xngwmimtkjvcnrb8	nrvc77uqaawbor31e1bx4c9a	ahddoviukw59tppq0q4yuowi	SKU-ahddoviukw59tppq0q4yuowi	3113	EUR	100	0	\N	t	2025-11-25 14:59:21.379	2025-11-25 14:59:21.379	\N
xqkob5fply9sotm2hqbfiklv	nrvc77uqaawbor31e1bx4c9a	p6hs51fufxegefxch9lxapoj	SKU-p6hs51fufxegefxch9lxapoj	1995	EUR	100	0	\N	t	2025-11-25 14:59:22.025	2025-11-25 14:59:22.025	\N
wtnxm7zwyz4asc0px5kuj8ih	nrvc77uqaawbor31e1bx4c9a	v0nln4s4ohybdrdn8cioz6p7	SKU-v0nln4s4ohybdrdn8cioz6p7	1178	EUR	100	0	\N	t	2025-11-25 14:59:22.727	2025-11-25 14:59:22.727	\N
kodn0e1pkjwlfmrd0mk45xu0	nrvc77uqaawbor31e1bx4c9a	fx3vg5gg9frc07pzbksya12l	SKU-fx3vg5gg9frc07pzbksya12l	1605	EUR	100	0	\N	t	2025-11-25 14:59:23.457	2025-11-25 14:59:23.457	\N
urkpp8ck1gf1ktlgxletq1cx	nrvc77uqaawbor31e1bx4c9a	leankxp5h6b9ca46i9nrrjb4	SKU-leankxp5h6b9ca46i9nrrjb4	833	EUR	100	0	\N	t	2025-11-25 14:59:24.097	2025-11-25 14:59:24.097	\N
josq3ibpm9ja0nkpxpqbeoq8	nrvc77uqaawbor31e1bx4c9a	d2dc6rie5cxuwyg1l4trb179	SKU-d2dc6rie5cxuwyg1l4trb179	1080	EUR	100	0	\N	t	2025-11-25 14:59:24.732	2025-11-25 14:59:24.732	\N
q3q6cw62ib1wxtr5urw5nf4s	nrvc77uqaawbor31e1bx4c9a	m9us3cswsk1ewlnt3fis47v9	SKU-m9us3cswsk1ewlnt3fis47v9	3600	EUR	100	0	\N	t	2025-11-25 14:59:25.369	2025-11-25 14:59:25.369	\N
fzep873hywfg46xo951h6275	nrvc77uqaawbor31e1bx4c9a	fpjojv116wy694jlaw1iif42	SKU-fpjojv116wy694jlaw1iif42	1650	EUR	100	0	\N	t	2025-11-25 14:59:26.004	2025-11-25 14:59:26.004	\N
bf801tgvng6pelfq3qg9595g	nrvc77uqaawbor31e1bx4c9a	u5d8qqtuka8be642wld12z8s	SKU-u5d8qqtuka8be642wld12z8s	1988	EUR	100	0	\N	t	2025-11-25 14:59:26.639	2025-11-25 14:59:26.639	\N
oy16sbah9um7voidvokui5z7	nrvc77uqaawbor31e1bx4c9a	urfjoi8rtn6ku0imy08hvaq7	SKU-urfjoi8rtn6ku0imy08hvaq7	3315	EUR	100	0	\N	t	2025-11-25 14:59:27.272	2025-11-25 14:59:27.272	\N
zjpvw31zlbh1pfr576c4i8n1	nrvc77uqaawbor31e1bx4c9a	qh538kzqkzhhf1k94siog49w	SKU-qh538kzqkzhhf1k94siog49w	2850	EUR	100	0	\N	t	2025-11-25 14:59:27.91	2025-11-25 14:59:27.91	\N
s4ybmm8s1euyrgqiih6yplpk	nrvc77uqaawbor31e1bx4c9a	gv2gw4s1w5yb2xvh06lu8eeh	SKU-gv2gw4s1w5yb2xvh06lu8eeh	2903	EUR	100	0	\N	t	2025-11-25 14:59:28.548	2025-11-25 14:59:28.548	\N
z8wnqu4t5w3kuw9jnu6t0b5i	nrvc77uqaawbor31e1bx4c9a	ubigezwxapbxkiva0nhfpekc	SKU-ubigezwxapbxkiva0nhfpekc	2895	EUR	100	0	\N	t	2025-11-25 14:59:29.18	2025-11-25 14:59:29.18	\N
yyqb72kq7hmo58qvsllbeuom	nrvc77uqaawbor31e1bx4c9a	bd49qhzps3xqpvht9zw53sk6	SKU-bd49qhzps3xqpvht9zw53sk6	2895	EUR	100	0	\N	t	2025-11-25 14:59:29.819	2025-11-25 14:59:29.819	\N
hfijl9e4ea0xjxgtni6hq3x2	nrvc77uqaawbor31e1bx4c9a	vdl8luizhuvfqqbd2145u4pn	SKU-vdl8luizhuvfqqbd2145u4pn	4118	EUR	100	0	\N	t	2025-11-25 14:59:30.454	2025-11-25 14:59:30.454	\N
o0fc4wp20llss4ejt36vq6x2	nrvc77uqaawbor31e1bx4c9a	ikgnsant5ruarbhydz36r7vi	SKU-ikgnsant5ruarbhydz36r7vi	6773	EUR	100	0	\N	t	2025-11-25 14:59:31.092	2025-11-25 14:59:31.092	\N
f4b9aw42mozor5x4b7uoi3aq	nrvc77uqaawbor31e1bx4c9a	ixty2sl259tm8c701c47almi	SKU-ixty2sl259tm8c701c47almi	3098	EUR	100	0	\N	t	2025-11-25 14:59:31.756	2025-11-25 14:59:31.756	\N
oj1oryibo1yo8p4dot8yiz0c	nrvc77uqaawbor31e1bx4c9a	cr66dix27dp5rtqxo3c56su8	SKU-cr66dix27dp5rtqxo3c56su8	2850	EUR	100	0	\N	t	2025-11-25 14:59:32.431	2025-11-25 14:59:32.431	\N
sycfz4hqrszg0qrk89vzwega	nrvc77uqaawbor31e1bx4c9a	lm8pbicnuofxdimnn0mg2145	SKU-lm8pbicnuofxdimnn0mg2145	2850	EUR	100	0	\N	t	2025-11-25 14:59:33.066	2025-11-25 14:59:33.066	\N
o9gijh6kgsxubagoo868a1tc	nrvc77uqaawbor31e1bx4c9a	c6r7fb70vp9qtsyj5nt5wp4q	SKU-c6r7fb70vp9qtsyj5nt5wp4q	1485	EUR	100	0	\N	t	2025-11-25 14:59:33.702	2025-11-25 14:59:33.702	\N
nlpq21pn1602j6ujj7a3iywq	nrvc77uqaawbor31e1bx4c9a	tlp887lqv92jmdycadv9ozwc	SKU-tlp887lqv92jmdycadv9ozwc	3675	EUR	100	0	\N	t	2025-11-25 14:59:34.343	2025-11-25 14:59:34.343	\N
bqah38hu57jvqxisxeexflp3	nrvc77uqaawbor31e1bx4c9a	ledsfty7ev28y8pnpt7pc5k1	SKU-ledsfty7ev28y8pnpt7pc5k1	2925	EUR	100	0	\N	t	2025-11-25 14:59:34.982	2025-11-25 14:59:34.982	\N
h4lilvmyh7c8lhdt3ycvyty1	nrvc77uqaawbor31e1bx4c9a	q9e0u8wu1fq3i8wr2ecqkvf7	SKU-q9e0u8wu1fq3i8wr2ecqkvf7	3750	EUR	100	0	\N	t	2025-11-25 14:59:35.626	2025-11-25 14:59:35.626	\N
k0ck62noyxslpo0eh2yuwu35	nrvc77uqaawbor31e1bx4c9a	whla9z9q0b5mly575tvk2001	SKU-whla9z9q0b5mly575tvk2001	2648	EUR	100	0	\N	t	2025-11-25 14:59:36.265	2025-11-25 14:59:36.265	\N
z831gcbeqlasy539l22jhxz3	nrvc77uqaawbor31e1bx4c9a	fh0yxqwgkhmdlpus9jwzxrzy	SKU-fh0yxqwgkhmdlpus9jwzxrzy	2640	EUR	100	0	\N	t	2025-11-25 14:59:36.902	2025-11-25 14:59:36.902	\N
dwfsx1moiz09t9zhepduwqp6	nrvc77uqaawbor31e1bx4c9a	knmr7qnnvyb65rzpulbmggdi	SKU-knmr7qnnvyb65rzpulbmggdi	1313	EUR	100	0	\N	t	2025-11-25 14:59:37.608	2025-11-25 14:59:37.608	\N
cleeau7xdanbg47j6dpmhu5n	nrvc77uqaawbor31e1bx4c9a	zmzl5rujpdlb9uq809bqps12	SKU-zmzl5rujpdlb9uq809bqps12	1260	EUR	100	0	\N	t	2025-11-25 14:59:38.248	2025-11-25 14:59:38.248	\N
eg7qdabpnocip1layhm8x993	nrvc77uqaawbor31e1bx4c9a	nz44v0jn8ydrhk3cii1q62cl	SKU-nz44v0jn8ydrhk3cii1q62cl	1335	EUR	100	0	\N	t	2025-11-25 14:59:38.883	2025-11-25 14:59:38.883	\N
o3uwr1lbxrr687i710sx35t9	nrvc77uqaawbor31e1bx4c9a	xq892p39784ntf532muiur4i	SKU-xq892p39784ntf532muiur4i	1253	EUR	100	0	\N	t	2025-11-25 14:59:39.529	2025-11-25 14:59:39.529	\N
ynq3ta4ori6e4i7vi5inkjl0	nrvc77uqaawbor31e1bx4c9a	w5acz0adcz1lxpd3veixpohu	SKU-w5acz0adcz1lxpd3veixpohu	2625	EUR	100	0	\N	t	2025-11-25 14:59:40.161	2025-11-25 14:59:40.161	\N
jt0jjkh17xsjg075vimwzs6b	nrvc77uqaawbor31e1bx4c9a	cba9u2xonwdg9rsjp8c8ks45	SKU-cba9u2xonwdg9rsjp8c8ks45	3195	EUR	100	0	\N	t	2025-11-25 14:59:40.803	2025-11-25 14:59:40.803	\N
wu6suzt9fe6mwz4jeuw1g3nf	nrvc77uqaawbor31e1bx4c9a	osviylmksb4t5dfl8lb9kltx	SKU-osviylmksb4t5dfl8lb9kltx	2970	EUR	100	0	\N	t	2025-11-25 14:59:41.443	2025-11-25 14:59:41.443	\N
stxajmu8iqagijodylhfeo3n	nrvc77uqaawbor31e1bx4c9a	jesavo21hlq1ek3day9t2eag	SKU-jesavo21hlq1ek3day9t2eag	4200	EUR	100	0	\N	t	2025-11-25 14:59:42.095	2025-11-25 14:59:42.095	\N
v0pejhl5fimxu8d4s8mce06y	nrvc77uqaawbor31e1bx4c9a	h3qiq4kem8dmh57elddmc2sq	SKU-h3qiq4kem8dmh57elddmc2sq	4140	EUR	100	0	\N	t	2025-11-25 14:59:42.732	2025-11-25 14:59:42.732	\N
q9i4k9dr1c3sg8qliwsmybxy	nrvc77uqaawbor31e1bx4c9a	op18t9jxykksnodje9im0to7	SKU-op18t9jxykksnodje9im0to7	3570	EUR	100	0	\N	t	2025-11-25 14:59:43.372	2025-11-25 14:59:43.372	\N
n9aak97iv2oxrmhl9rvdqvjm	nrvc77uqaawbor31e1bx4c9a	oghxgbil53py5mvyg41p8qud	SKU-oghxgbil53py5mvyg41p8qud	2820	EUR	100	0	\N	t	2025-11-25 14:59:44.022	2025-11-25 14:59:44.022	\N
aetjgz2robo6yzuq3jsuou4n	nrvc77uqaawbor31e1bx4c9a	vub6m66hh0zn236q2lems5ir	SKU-vub6m66hh0zn236q2lems5ir	2445	EUR	100	0	\N	t	2025-11-25 14:59:44.655	2025-11-25 14:59:44.655	\N
lb8mmzxx72o5dhz40phwilkl	nrvc77uqaawbor31e1bx4c9a	q8r9llsple7cmb7uc2w0e3ef	SKU-q8r9llsple7cmb7uc2w0e3ef	2820	EUR	100	0	\N	t	2025-11-25 14:59:45.294	2025-11-25 14:59:45.294	\N
g2ciqa3uydkl2dbq32t3714g	nrvc77uqaawbor31e1bx4c9a	ukj8lpqtskeai5522wrcimas	SKU-ukj8lpqtskeai5522wrcimas	3788	EUR	100	0	\N	t	2025-11-25 14:59:45.936	2025-11-25 14:59:45.936	\N
wyhk1evo69ryqaet20aohyee	nrvc77uqaawbor31e1bx4c9a	xuekwuonbdvx2mrsb6s12wka	SKU-xuekwuonbdvx2mrsb6s12wka	2820	EUR	100	0	\N	t	2025-11-25 14:59:46.581	2025-11-25 14:59:46.581	\N
msdy0kuykygg652cxsezhf0f	nrvc77uqaawbor31e1bx4c9a	k8tbxve7b3crg6zxuyil2qp1	SKU-k8tbxve7b3crg6zxuyil2qp1	3375	EUR	100	0	\N	t	2025-11-25 14:59:47.216	2025-11-25 14:59:47.216	\N
q8gchul40jp8bmwt5nhmwwzz	nrvc77uqaawbor31e1bx4c9a	oncmqvafcqf69wdudqvxcc53	SKU-oncmqvafcqf69wdudqvxcc53	3113	EUR	100	0	\N	t	2025-11-25 14:59:47.859	2025-11-25 14:59:47.859	\N
hnphtxaxvous9fm2veo74o8v	nrvc77uqaawbor31e1bx4c9a	ga005dqydb7roi3v2n8x4msn	SKU-ga005dqydb7roi3v2n8x4msn	3150	EUR	100	0	\N	t	2025-11-25 14:59:48.535	2025-11-25 14:59:48.535	\N
ws3t8z4jjcr4qgjd5jgzf8g8	nrvc77uqaawbor31e1bx4c9a	cbqfyf41dfuwwgaiy1767uqg	SKU-cbqfyf41dfuwwgaiy1767uqg	3750	EUR	100	0	\N	t	2025-11-25 14:59:49.17	2025-11-25 14:59:49.17	\N
lbli4i4ta6v5hy3kg8qr8xs8	nrvc77uqaawbor31e1bx4c9a	y8zk80c40iolbpv4bvqqs3io	SKU-y8zk80c40iolbpv4bvqqs3io	3075	EUR	100	0	\N	t	2025-11-25 14:59:49.807	2025-11-25 14:59:49.807	\N
sui43to298iq4s6rz5hqjerv	nrvc77uqaawbor31e1bx4c9a	wwv6y3sdb4wcq2t01m9u50g4	SKU-wwv6y3sdb4wcq2t01m9u50g4	5250	EUR	100	0	\N	t	2025-11-25 14:59:50.448	2025-11-25 14:59:50.448	\N
yuei9ktuafiygxau1luzeyie	nrvc77uqaawbor31e1bx4c9a	p5gsty2e8ad3fm8mn68rbk51	SKU-p5gsty2e8ad3fm8mn68rbk51	2828	EUR	100	0	\N	t	2025-11-25 14:59:51.086	2025-11-25 14:59:51.086	\N
ih89y8n0v3nttn0l16wp9glz	nrvc77uqaawbor31e1bx4c9a	wm3uh4ocspwhzisb85b0m7zv	SKU-wm3uh4ocspwhzisb85b0m7zv	2340	EUR	100	0	\N	t	2025-11-25 14:59:51.733	2025-11-25 14:59:51.733	\N
qczsyjpn3y5ulz3250a2v6es	nrvc77uqaawbor31e1bx4c9a	hzmhps1xi5e2h385szvnl507	SKU-hzmhps1xi5e2h385szvnl507	3075	EUR	100	0	\N	t	2025-11-25 14:59:52.372	2025-11-25 14:59:52.372	\N
ujhybsme7nh7bv4sfxuu3xka	nrvc77uqaawbor31e1bx4c9a	f59l1brye4c3uhzb3kbj9r7j	SKU-f59l1brye4c3uhzb3kbj9r7j	3975	EUR	100	0	\N	t	2025-11-25 14:59:53.077	2025-11-25 14:59:53.077	\N
axaihxese6tbwo0wjv882xkg	nrvc77uqaawbor31e1bx4c9a	zdji32nxv0lpkzopyj8gqly3	SKU-zdji32nxv0lpkzopyj8gqly3	2940	EUR	100	0	\N	t	2025-11-25 14:59:53.714	2025-11-25 14:59:53.714	\N
zmk5ub9qb4fn8xmpl5oejrd3	nrvc77uqaawbor31e1bx4c9a	w3hgvrx6bmszeeszn0cnlh4y	SKU-w3hgvrx6bmszeeszn0cnlh4y	3068	EUR	100	0	\N	t	2025-11-25 14:59:54.352	2025-11-25 14:59:54.352	\N
yagrf9foaezrczi6bedpnvxs	nrvc77uqaawbor31e1bx4c9a	ceurpiiq8edxjnqwx7vtoe51	SKU-ceurpiiq8edxjnqwx7vtoe51	3338	EUR	100	0	\N	t	2025-11-25 14:59:54.989	2025-11-25 14:59:54.989	\N
ja42363anfnn30zu5430wt11	nrvc77uqaawbor31e1bx4c9a	le2unocd0uc8qvhdh3ytc0yj	SKU-le2unocd0uc8qvhdh3ytc0yj	1980	EUR	100	0	\N	t	2025-11-25 14:59:55.628	2025-11-25 14:59:55.628	\N
f8xkzvmlge1uxcdr57y38rgj	nrvc77uqaawbor31e1bx4c9a	fg66ho5xpt6xjq5tw5wucqef	SKU-fg66ho5xpt6xjq5tw5wucqef	2003	EUR	100	0	\N	t	2025-11-25 14:59:56.273	2025-11-25 14:59:56.273	\N
gf12lf3dptbiv4nlmfl1m0eb	nrvc77uqaawbor31e1bx4c9a	s6ber90d5x4io7zwu1km1xd4	SKU-s6ber90d5x4io7zwu1km1xd4	3525	EUR	100	0	\N	t	2025-11-25 14:59:56.912	2025-11-25 14:59:56.912	\N
u95d8e7hq2cop73oxwgmr6dw	nrvc77uqaawbor31e1bx4c9a	rt9atq268wl0iudws9dbakdl	SKU-rt9atq268wl0iudws9dbakdl	2340	EUR	100	0	\N	t	2025-11-25 14:59:57.556	2025-11-25 14:59:57.556	\N
jvu73mptulyvbn35jfr22oxe	nrvc77uqaawbor31e1bx4c9a	brj405fwcshotxslcyz0b4ix	SKU-brj405fwcshotxslcyz0b4ix	4200	EUR	100	0	\N	t	2025-11-25 14:59:58.191	2025-11-25 14:59:58.191	\N
up8nck100i7voptnnqol39qm	nrvc77uqaawbor31e1bx4c9a	qynuukauq1u71ffj3xcn49ew	SKU-qynuukauq1u71ffj3xcn49ew	2850	EUR	100	0	\N	t	2025-11-25 14:59:58.825	2025-11-25 14:59:58.825	\N
d8im1hrbkittk7bz4ib4x799	nrvc77uqaawbor31e1bx4c9a	gvts4v6e5u2ksi1guw7f9azl	SKU-gvts4v6e5u2ksi1guw7f9azl	2663	EUR	100	0	\N	t	2025-11-25 14:59:59.464	2025-11-25 14:59:59.464	\N
qxa098dl6o3o0viycqmes8di	nrvc77uqaawbor31e1bx4c9a	ilpi3pvhn8e96wfj4xa28fhk	SKU-ilpi3pvhn8e96wfj4xa28fhk	3585	EUR	100	0	\N	t	2025-11-25 15:00:00.097	2025-11-25 15:00:00.097	\N
j67jxblvzv6rgzu3uqags0e4	nrvc77uqaawbor31e1bx4c9a	vq2fbrdtmou2uxgoglebgb6q	SKU-vq2fbrdtmou2uxgoglebgb6q	3203	EUR	100	0	\N	t	2025-11-25 15:00:00.761	2025-11-25 15:00:00.761	\N
nivcu86gyn9qsowddjnfbscv	nrvc77uqaawbor31e1bx4c9a	iwn3xjrgsax8pdkxu3moy7fp	SKU-iwn3xjrgsax8pdkxu3moy7fp	3930	EUR	100	0	\N	t	2025-11-25 15:00:01.407	2025-11-25 15:00:01.407	\N
gozfgu4qxrray2uw12gjyrcq	nrvc77uqaawbor31e1bx4c9a	mtaop46wwdczyw3375go42ke	SKU-mtaop46wwdczyw3375go42ke	2865	EUR	100	0	\N	t	2025-11-25 15:00:02.046	2025-11-25 15:00:02.046	\N
a96ndi2ujj1dkgoj1c5tq1xk	nrvc77uqaawbor31e1bx4c9a	fopx8n2ekbl4e29nv1bchi5p	SKU-fopx8n2ekbl4e29nv1bchi5p	3150	EUR	100	0	\N	t	2025-11-25 15:00:02.78	2025-11-25 15:00:02.78	\N
n632rtpk9lhlangtwrndgqw3	nrvc77uqaawbor31e1bx4c9a	l4ahl0oz9a0rwkub87gcsvpm	SKU-l4ahl0oz9a0rwkub87gcsvpm	3300	EUR	100	0	\N	t	2025-11-25 15:00:03.416	2025-11-25 15:00:03.416	\N
g2v4auny79rhzdu0yir2nn6i	nrvc77uqaawbor31e1bx4c9a	qv7glg9dmahd3p5ufd171mf3	SKU-qv7glg9dmahd3p5ufd171mf3	3128	EUR	100	0	\N	t	2025-11-25 15:00:04.05	2025-11-25 15:00:04.05	\N
mk5q6m6p1z3voop9i93zm4qi	nrvc77uqaawbor31e1bx4c9a	o9fl3376kwfz9u0c9a9qibxg	SKU-o9fl3376kwfz9u0c9a9qibxg	1425	EUR	100	0	\N	t	2025-11-25 15:00:04.692	2025-11-25 15:00:04.692	\N
g3ekobpjaqdh4cveei01p05d	nrvc77uqaawbor31e1bx4c9a	zuvslsec6gzhso8t3yx9scve	SKU-zuvslsec6gzhso8t3yx9scve	1560	EUR	100	0	\N	t	2025-11-25 15:00:05.326	2025-11-25 15:00:05.326	\N
u32ds4qpmrvt8dkrrus62dip	nrvc77uqaawbor31e1bx4c9a	u9lonuti9y72r4u6svhnjr22	SKU-u9lonuti9y72r4u6svhnjr22	924	EUR	100	0	\N	t	2025-11-25 15:08:28.232	2025-11-25 15:08:28.232	\N
xweobn7l5vgiq5gysnpl3u9v	nrvc77uqaawbor31e1bx4c9a	ikc9ocvsj17nqv0i8ezfsk1j	SKU-ikc9ocvsj17nqv0i8ezfsk1j	326	EUR	100	0	\N	t	2025-11-25 15:08:28.871	2025-11-25 15:08:28.871	\N
rg0csv8bj2kfu6zqa2otq55k	nrvc77uqaawbor31e1bx4c9a	ooxv1n24dh81fywk9hrlteex	SKU-ooxv1n24dh81fywk9hrlteex	782	EUR	100	0	\N	t	2025-11-25 15:08:29.512	2025-11-25 15:08:29.512	\N
jxpk4vx923crrrua7r6xzspy	nrvc77uqaawbor31e1bx4c9a	pq1vyqmi61d3mxsrolt4tv2h	SKU-pq1vyqmi61d3mxsrolt4tv2h	408	EUR	100	0	\N	t	2025-11-25 15:08:30.154	2025-11-25 15:08:30.154	\N
br7kiqlada45hl4jlp1hp8jl	nrvc77uqaawbor31e1bx4c9a	jvwnbpnopxah6qkkqk1b8709	SKU-jvwnbpnopxah6qkkqk1b8709	907	EUR	100	0	\N	t	2025-11-25 15:08:30.812	2025-11-25 15:08:30.812	\N
reoztqd19oi6695fixagntiv	nrvc77uqaawbor31e1bx4c9a	ysf6qyhl2bqvk9q3xgpcdjy8	SKU-ysf6qyhl2bqvk9q3xgpcdjy8	843	EUR	100	0	\N	t	2025-11-25 15:08:31.449	2025-11-25 15:08:31.449	\N
erklyfdsgo5nc9vtxy60pnua	nrvc77uqaawbor31e1bx4c9a	mmah05icam8erezxkousrk0l	SKU-mmah05icam8erezxkousrk0l	1955	EUR	100	0	\N	t	2025-11-25 15:08:32.08	2025-11-25 15:08:32.08	\N
wpy2n1eosrge4e61m8lmfzgt	nrvc77uqaawbor31e1bx4c9a	htamqx2dgu85idtr2tkqwxzb	SKU-htamqx2dgu85idtr2tkqwxzb	504	EUR	100	0	\N	t	2025-11-25 15:08:32.713	2025-11-25 15:08:32.713	\N
lgxw3icul8cwemytlmmhmtfb	nrvc77uqaawbor31e1bx4c9a	assc9nh2g8bxg84a1jrx10u8	SKU-assc9nh2g8bxg84a1jrx10u8	1282	EUR	100	0	\N	t	2025-11-25 15:08:33.347	2025-11-25 15:08:33.347	\N
q64etmaq0qow8cp67cwpuzcy	nrvc77uqaawbor31e1bx4c9a	la3n4rudxbxz6mosbowaddvz	SKU-la3n4rudxbxz6mosbowaddvz	1403	EUR	100	0	\N	t	2025-11-25 15:08:33.988	2025-11-25 15:08:33.988	\N
g0osm4ly3qsn2bzp1zh89vbt	nrvc77uqaawbor31e1bx4c9a	rdzbzdbxmjeluyxcl8tb12b6	SKU-rdzbzdbxmjeluyxcl8tb12b6	740	EUR	100	0	\N	t	2025-11-25 15:08:34.621	2025-11-25 15:08:34.621	\N
xgpt1hmfyte2rwr6gqe9jijq	nrvc77uqaawbor31e1bx4c9a	tiorubutzat1w2i5vytecdpg	SKU-tiorubutzat1w2i5vytecdpg	523	EUR	100	0	\N	t	2025-11-25 15:08:35.259	2025-11-25 15:08:35.259	\N
x1mrtbhu89b1f7y7setj8pou	nrvc77uqaawbor31e1bx4c9a	jo24yrzman8p4apsiavizb8v	SKU-jo24yrzman8p4apsiavizb8v	1581	EUR	100	0	\N	t	2025-11-25 15:08:35.944	2025-11-25 15:08:35.944	\N
zn13l810nsxdwvhd959glhyg	nrvc77uqaawbor31e1bx4c9a	oohknshddfv8move0l0wwf5m	SKU-oohknshddfv8move0l0wwf5m	1360	EUR	100	0	\N	t	2025-11-25 15:08:36.583	2025-11-25 15:08:36.583	\N
n8jpw88dkk43jjsx8vpaeylg	nrvc77uqaawbor31e1bx4c9a	kdwdfvypliznd62tmtb0h23v	SKU-kdwdfvypliznd62tmtb0h23v	468	EUR	100	0	\N	t	2025-11-25 15:08:37.219	2025-11-25 15:08:37.219	\N
crgbdo05rsufsqls4rf6yywa	nrvc77uqaawbor31e1bx4c9a	k1j145gvbeve3p0isooifxqv	SKU-k1j145gvbeve3p0isooifxqv	1133	EUR	100	0	\N	t	2025-11-25 15:08:37.878	2025-11-25 15:08:37.878	\N
gmpvd20kpgzauhyj7murqnix	nrvc77uqaawbor31e1bx4c9a	n31hxjwiqoq5n8smdjnpfvoz	SKU-n31hxjwiqoq5n8smdjnpfvoz	927	EUR	100	0	\N	t	2025-11-25 15:08:38.581	2025-11-25 15:08:38.581	\N
xc61p37sg7i69nh2kfl4p2kw	nrvc77uqaawbor31e1bx4c9a	g0wwqwttw7w2g385i31kie4z	SKU-g0wwqwttw7w2g385i31kie4z	1363	EUR	100	0	\N	t	2025-11-25 15:08:39.218	2025-11-25 15:08:39.218	\N
prc9v9djfvt6bbng0bzyx2i3	nrvc77uqaawbor31e1bx4c9a	n4lynsjbfbgb37vckedjpvsj	SKU-n4lynsjbfbgb37vckedjpvsj	408	EUR	100	0	\N	t	2025-11-25 15:08:39.849	2025-11-25 15:08:39.849	\N
nzayxeqvp64rvm7vmv31y9sn	nrvc77uqaawbor31e1bx4c9a	nh8pbchfnuiq9y20lcqq9z6v	SKU-nh8pbchfnuiq9y20lcqq9z6v	1573	EUR	100	0	\N	t	2025-11-25 15:08:40.481	2025-11-25 15:08:40.481	\N
mae5f6a9bkjpuzmzfmma9hmk	nrvc77uqaawbor31e1bx4c9a	rqo214629mqorlec7avmk6cb	SKU-rqo214629mqorlec7avmk6cb	408	EUR	100	0	\N	t	2025-11-25 15:08:41.119	2025-11-25 15:08:41.119	\N
nczgsys1e9o0mgge3zd6sr42	nrvc77uqaawbor31e1bx4c9a	sx1o11srem8y5y7ho5si6h6m	SKU-sx1o11srem8y5y7ho5si6h6m	772	EUR	100	0	\N	t	2025-11-25 15:08:41.755	2025-11-25 15:08:41.755	\N
mkxqs3eh749xz9b17c08jqcm	nrvc77uqaawbor31e1bx4c9a	r8rfb5ugq2sbq6sworo80cnp	SKU-r8rfb5ugq2sbq6sworo80cnp	504	EUR	100	0	\N	t	2025-11-25 15:08:42.408	2025-11-25 15:08:42.408	\N
u7n127eb436warcrk8egh9om	nrvc77uqaawbor31e1bx4c9a	ekccn3gb02bgpgdx3vh73lw5	SKU-ekccn3gb02bgpgdx3vh73lw5	782	EUR	100	0	\N	t	2025-11-25 15:08:43.042	2025-11-25 15:08:43.042	\N
qfnj8hv2oibflekesq9zpme9	nrvc77uqaawbor31e1bx4c9a	m8q9b3lvm2vlbumthy3qniy6	SKU-m8q9b3lvm2vlbumthy3qniy6	2040	EUR	100	0	\N	t	2025-11-25 15:08:43.696	2025-11-25 15:08:43.696	\N
t6ftull5hxy49qqp13tvekfe	nrvc77uqaawbor31e1bx4c9a	mx0n9v5ct110pjcook3y0lcy	SKU-mx0n9v5ct110pjcook3y0lcy	907	EUR	100	0	\N	t	2025-11-25 15:08:44.333	2025-11-25 15:08:44.333	\N
e522qowgdfqlp0bgzlmir6w6	nrvc77uqaawbor31e1bx4c9a	zzgor0z0yawvue29qpib0364	SKU-zzgor0z0yawvue29qpib0364	782	EUR	100	0	\N	t	2025-11-25 15:08:44.974	2025-11-25 15:08:44.974	\N
zy2r1u8f5dwl15op3z95zsvd	nrvc77uqaawbor31e1bx4c9a	dami8d4m1brped61c41j37tm	SKU-dami8d4m1brped61c41j37tm	1505	EUR	100	0	\N	t	2025-11-25 15:08:45.605	2025-11-25 15:08:45.605	\N
wq9s6gropkzl15qknkt5ztn3	nrvc77uqaawbor31e1bx4c9a	y7p1sauvgzaeqk9atji6ulru	SKU-y7p1sauvgzaeqk9atji6ulru	2890	EUR	100	0	\N	t	2025-11-25 15:08:46.239	2025-11-25 15:08:46.239	\N
sblqdv961ymnzybtyf0h8f1o	nrvc77uqaawbor31e1bx4c9a	y7yw92zi0bbp71d37m8vq9lj	SKU-y7yw92zi0bbp71d37m8vq9lj	1658	EUR	100	0	\N	t	2025-11-25 15:08:46.991	2025-11-25 15:08:46.991	\N
w61l6lht11o9gzaw9diji66o	nrvc77uqaawbor31e1bx4c9a	em0r3uccn7a6ufujvxu9ikp6	SKU-em0r3uccn7a6ufujvxu9ikp6	1126	EUR	100	0	\N	t	2025-11-25 15:08:47.628	2025-11-25 15:08:47.628	\N
h07af4whdso0mym1h0gs3tle	nrvc77uqaawbor31e1bx4c9a	cq0kcn7qnoohl7qrgm7w01w8	SKU-cq0kcn7qnoohl7qrgm7w01w8	1105	EUR	100	0	\N	t	2025-11-25 15:08:48.272	2025-11-25 15:08:48.272	\N
n9h4pcol13qh49n5q3xer67u	nrvc77uqaawbor31e1bx4c9a	upg2lvgb6o9l180uz2b893bu	SKU-upg2lvgb6o9l180uz2b893bu	1190	EUR	100	0	\N	t	2025-11-25 15:08:48.954	2025-11-25 15:08:48.954	\N
al920gl2v8ppo5ckogoe3ah6	nrvc77uqaawbor31e1bx4c9a	espw0zrep65egu272xeinjwx	SKU-espw0zrep65egu272xeinjwx	1053	EUR	100	0	\N	t	2025-11-25 15:08:49.593	2025-11-25 15:08:49.593	\N
oqdth70br83van1xld0fzbbc	nrvc77uqaawbor31e1bx4c9a	lk5mwj3m67dfi7247r7rw18h	SKU-lk5mwj3m67dfi7247r7rw18h	1265	EUR	100	0	\N	t	2025-11-25 15:08:50.225	2025-11-25 15:08:50.225	\N
s85sgmat3pmgwdiiljdoiflu	nrvc77uqaawbor31e1bx4c9a	f1hq5y0eryj36sgouvj4l4n2	SKU-f1hq5y0eryj36sgouvj4l4n2	575	EUR	100	0	\N	t	2025-11-25 15:08:50.86	2025-11-25 15:08:50.86	\N
q1ezc6vkvsngvfi93yoz4uo2	nrvc77uqaawbor31e1bx4c9a	ccyb0q9i13dr7gvudkitmy2j	SKU-ccyb0q9i13dr7gvudkitmy2j	575	EUR	100	0	\N	t	2025-11-25 15:08:51.498	2025-11-25 15:08:51.498	\N
tkwr5x7zj3t4k1gvehk5pzhe	nrvc77uqaawbor31e1bx4c9a	poswisdjise7s7i4c3q6uk6z	SKU-poswisdjise7s7i4c3q6uk6z	1122	EUR	100	0	\N	t	2025-11-25 15:08:52.129	2025-11-25 15:08:52.129	\N
zr4ucoaze2qqgrdgufznzyvm	nrvc77uqaawbor31e1bx4c9a	u67ny0l6yrtdt5mkzwbjm8bg	SKU-u67ny0l6yrtdt5mkzwbjm8bg	992	EUR	100	0	\N	t	2025-11-25 15:08:52.764	2025-11-25 15:08:52.764	\N
jy18qvdbrfusbzvufxyefu5f	nrvc77uqaawbor31e1bx4c9a	ig5ivq6a1jlx8ni40nng7y5z	SKU-ig5ivq6a1jlx8ni40nng7y5z	2070	EUR	100	0	\N	t	2025-11-25 15:00:05.969	2025-11-25 15:00:05.969	\N
a1o8bbezef41umparmk6g5kt	nrvc77uqaawbor31e1bx4c9a	tb480o6799j7gmk8cj0wu81s	SKU-tb480o6799j7gmk8cj0wu81s	2513	EUR	100	0	\N	t	2025-11-25 15:00:06.609	2025-11-25 15:00:06.609	\N
drwjuxmo90s6extkfmih2atw	nrvc77uqaawbor31e1bx4c9a	ausigg5uzijiv44kjcl4a6hn	SKU-ausigg5uzijiv44kjcl4a6hn	2318	EUR	100	0	\N	t	2025-11-25 15:00:07.24	2025-11-25 15:00:07.24	\N
ybua8w2zhbcxifld4acn1you	nrvc77uqaawbor31e1bx4c9a	e55vxytex8sj7ciql5fe7vsx	SKU-e55vxytex8sj7ciql5fe7vsx	3780	EUR	100	0	\N	t	2025-11-25 15:00:07.952	2025-11-25 15:00:07.952	\N
lahmfkxdai1q9uc7tzolzmzd	nrvc77uqaawbor31e1bx4c9a	z5rlyfsbdmjfgsr6d00gh1ih	SKU-z5rlyfsbdmjfgsr6d00gh1ih	2970	EUR	100	0	\N	t	2025-11-25 15:00:08.586	2025-11-25 15:00:08.586	\N
aubl0skfphwoef0h3ffqry19	nrvc77uqaawbor31e1bx4c9a	ry0h311cwz0rynfo3lapl6yt	SKU-ry0h311cwz0rynfo3lapl6yt	4020	EUR	100	0	\N	t	2025-11-25 15:00:09.223	2025-11-25 15:00:09.223	\N
lvws9q8p7d0l8u5ogncwvl8c	nrvc77uqaawbor31e1bx4c9a	grlop2gp7epzwhso6ylstifs	SKU-grlop2gp7epzwhso6ylstifs	923	EUR	100	0	\N	t	2025-11-25 15:00:09.865	2025-11-25 15:00:09.865	\N
jz3jieb8lul2lk3aajhheepl	nrvc77uqaawbor31e1bx4c9a	gxdab68l6ofg73cr882qv5fq	SKU-gxdab68l6ofg73cr882qv5fq	3128	EUR	100	0	\N	t	2025-11-25 15:00:10.516	2025-11-25 15:00:10.516	\N
yh2q57wug264fxtn51lfyeyj	nrvc77uqaawbor31e1bx4c9a	ch70hlh1yyhry0viq86wj3tj	SKU-ch70hlh1yyhry0viq86wj3tj	1838	EUR	100	0	\N	t	2025-11-25 15:00:11.154	2025-11-25 15:00:11.154	\N
btg2wu74t94gy4477uy1zs5b	nrvc77uqaawbor31e1bx4c9a	xq5vvvjn61demtwt8bzg2kyt	SKU-xq5vvvjn61demtwt8bzg2kyt	6075	EUR	100	0	\N	t	2025-11-25 15:00:11.806	2025-11-25 15:00:11.806	\N
cgpd7jeju66fwqo693p55l71	nrvc77uqaawbor31e1bx4c9a	kz6dldyng3nmtg3vz8pphyiu	SKU-kz6dldyng3nmtg3vz8pphyiu	1890	EUR	100	0	\N	t	2025-11-25 15:00:12.542	2025-11-25 15:00:12.542	\N
o4tzigsey5p372vcpy5w9trk	nrvc77uqaawbor31e1bx4c9a	o805iy7aiv0lwi45s4w572dv	SKU-o805iy7aiv0lwi45s4w572dv	1913	EUR	100	0	\N	t	2025-11-25 15:00:13.193	2025-11-25 15:00:13.193	\N
w8ab9ikvf0gvdaerazbajf5l	nrvc77uqaawbor31e1bx4c9a	gdnqgxq9fkz9cotefqpkabzm	SKU-gdnqgxq9fkz9cotefqpkabzm	1553	EUR	100	0	\N	t	2025-11-25 15:00:13.845	2025-11-25 15:00:13.845	\N
e8idb794gbktq2gwv9kuklxr	nrvc77uqaawbor31e1bx4c9a	tao2tip0z9wz6o36vrrj5x4p	SKU-tao2tip0z9wz6o36vrrj5x4p	9075	EUR	100	0	\N	t	2025-11-25 15:00:14.496	2025-11-25 15:00:14.496	\N
f9yszs54pczy7ne4upvigzqy	nrvc77uqaawbor31e1bx4c9a	vrcvekxjw4hawd327s9zfdf1	SKU-vrcvekxjw4hawd327s9zfdf1	2325	EUR	100	0	\N	t	2025-11-25 15:00:15.134	2025-11-25 15:00:15.134	\N
g6uvwuz3u089qfjsvbhh8edq	nrvc77uqaawbor31e1bx4c9a	t68153rlidi00kn7ujk9v91c	SKU-t68153rlidi00kn7ujk9v91c	10853	EUR	100	0	\N	t	2025-11-25 15:00:15.805	2025-11-25 15:00:15.805	\N
jb6bg6f6aib97qc072slxxxr	nrvc77uqaawbor31e1bx4c9a	d8pkewc83cxz4419wqc280j8	SKU-d8pkewc83cxz4419wqc280j8	2363	EUR	100	0	\N	t	2025-11-25 15:00:16.448	2025-11-25 15:00:16.448	\N
ernfekfftyywue609vwm8ai4	nrvc77uqaawbor31e1bx4c9a	i8h7fexp2sjfrt9p6mp4umr8	SKU-i8h7fexp2sjfrt9p6mp4umr8	15375	EUR	100	0	\N	t	2025-11-25 15:00:17.081	2025-11-25 15:00:17.081	\N
f9o9qlqhflez8k63fqk3fkfl	nrvc77uqaawbor31e1bx4c9a	hmhkoydknrqurnhfvoxb9mgk	SKU-hmhkoydknrqurnhfvoxb9mgk	9075	EUR	100	0	\N	t	2025-11-25 15:00:17.718	2025-11-25 15:00:17.718	\N
r070gjmexyrnl8k1iittgff7	nrvc77uqaawbor31e1bx4c9a	j9pksnu8bw5tylmn9llnd9yk	SKU-j9pksnu8bw5tylmn9llnd9yk	2453	EUR	100	0	\N	t	2025-11-25 15:00:18.357	2025-11-25 15:00:18.357	\N
xbckg9ut2rc67x1cs7u2v4du	nrvc77uqaawbor31e1bx4c9a	em845qcuyqtpw9zyfkeq3sju	SKU-em845qcuyqtpw9zyfkeq3sju	2453	EUR	100	0	\N	t	2025-11-25 15:00:18.999	2025-11-25 15:00:18.999	\N
ab764epupgpdaxtdoy4mlitw	nrvc77uqaawbor31e1bx4c9a	eg6jou2unshfi7rkyn6l3wux	SKU-eg6jou2unshfi7rkyn6l3wux	1688	EUR	100	0	\N	t	2025-11-25 15:00:19.652	2025-11-25 15:00:19.652	\N
efu7rtjytv63prv1eoz2b3eb	nrvc77uqaawbor31e1bx4c9a	xy7hm9v5fiuuwvc1sto7qq1s	SKU-xy7hm9v5fiuuwvc1sto7qq1s	1455	EUR	100	0	\N	t	2025-11-25 15:00:20.287	2025-11-25 15:00:20.287	\N
kmmcwhbgvkh9mjb6x9mgn2vf	nrvc77uqaawbor31e1bx4c9a	tffrj71cz3fybma9da10ufm6	SKU-tffrj71cz3fybma9da10ufm6	1275	EUR	100	0	\N	t	2025-11-25 15:00:20.931	2025-11-25 15:00:20.931	\N
cb6fhyzfop8x5045chcwshjd	nrvc77uqaawbor31e1bx4c9a	l7ixz9lckrbbws7gib188aow	SKU-l7ixz9lckrbbws7gib188aow	2760	EUR	100	0	\N	t	2025-11-25 15:00:21.575	2025-11-25 15:00:21.575	\N
cvitg70xba893q1ciu8sha2t	nrvc77uqaawbor31e1bx4c9a	oyezvhh7y59mk33xp7omsis8	SKU-oyezvhh7y59mk33xp7omsis8	1890	EUR	100	0	\N	t	2025-11-25 15:00:22.215	2025-11-25 15:00:22.215	\N
wz2va8411ocz3aixrbvb9no5	nrvc77uqaawbor31e1bx4c9a	ppbe43vb8rmq9lkc8xyoyp9c	SKU-ppbe43vb8rmq9lkc8xyoyp9c	2415	EUR	100	0	\N	t	2025-11-25 15:00:22.919	2025-11-25 15:00:22.919	\N
futlmh5c2lfuwjazsy2tdny0	nrvc77uqaawbor31e1bx4c9a	fwgn1u19uwmof7duwzqiwj3t	SKU-fwgn1u19uwmof7duwzqiwj3t	4545	EUR	100	0	\N	t	2025-11-25 15:00:23.573	2025-11-25 15:00:23.573	\N
izq3lrt3idx2yrd87sz8l5ar	nrvc77uqaawbor31e1bx4c9a	rgotd1poiocwb8at456fnlo6	SKU-rgotd1poiocwb8at456fnlo6	4545	EUR	100	0	\N	t	2025-11-25 15:00:24.206	2025-11-25 15:00:24.206	\N
b0nybwuncgtwozzgdob64dtp	nrvc77uqaawbor31e1bx4c9a	dpa3jmc9oxqhnofsbkyfwit1	SKU-dpa3jmc9oxqhnofsbkyfwit1	1733	EUR	100	0	\N	t	2025-11-25 15:00:24.854	2025-11-25 15:00:24.854	\N
tuooid1uqscz6mx8914jyc46	nrvc77uqaawbor31e1bx4c9a	gwdlqh5f2j52m5wky6e9njx3	SKU-gwdlqh5f2j52m5wky6e9njx3	2175	EUR	100	0	\N	t	2025-11-25 15:00:25.488	2025-11-25 15:00:25.488	\N
zv15ryngdmbb68y7w8ofio19	nrvc77uqaawbor31e1bx4c9a	fjq5na5gu9z2ic7xyvfv987w	SKU-fjq5na5gu9z2ic7xyvfv987w	2198	EUR	100	0	\N	t	2025-11-25 15:00:26.128	2025-11-25 15:00:26.128	\N
j3glodmvgltsscl20dcevrhj	nrvc77uqaawbor31e1bx4c9a	h7x6xxrwuou4ha9fl3drb1uc	SKU-h7x6xxrwuou4ha9fl3drb1uc	1950	EUR	100	0	\N	t	2025-11-25 15:00:26.761	2025-11-25 15:00:26.761	\N
cqd68ux28kffvffcacl1g4ba	nrvc77uqaawbor31e1bx4c9a	ctjrm40io50ghp9p4lyzq76r	SKU-ctjrm40io50ghp9p4lyzq76r	2025	EUR	100	0	\N	t	2025-11-25 15:00:27.407	2025-11-25 15:00:27.407	\N
eg6vfm1tef204rt34no1yzem	nrvc77uqaawbor31e1bx4c9a	sg1dhrda1hscz3pwoivoy8le	SKU-sg1dhrda1hscz3pwoivoy8le	7275	EUR	100	0	\N	t	2025-11-25 15:00:28.042	2025-11-25 15:00:28.042	\N
dn48yx3fo5d6fjnr1uc64vlc	nrvc77uqaawbor31e1bx4c9a	weihvn5rofq9zp637piwgsom	SKU-weihvn5rofq9zp637piwgsom	2483	EUR	100	0	\N	t	2025-11-25 15:00:28.682	2025-11-25 15:00:28.682	\N
nqrjywqxm8c04e8w8so7ietj	nrvc77uqaawbor31e1bx4c9a	ddanr8k4fwphcowu23vr1805	SKU-ddanr8k4fwphcowu23vr1805	2595	EUR	100	0	\N	t	2025-11-25 15:00:29.316	2025-11-25 15:00:29.316	\N
wl2tk9h28f4y93wms3u9fcwu	nrvc77uqaawbor31e1bx4c9a	lvboo92t7vuni4szulzgvk7q	SKU-lvboo92t7vuni4szulzgvk7q	4500	EUR	100	0	\N	t	2025-11-25 15:00:29.959	2025-11-25 15:00:29.959	\N
dyn8falrowwshhj9r7r3rmu7	nrvc77uqaawbor31e1bx4c9a	ij9hrj5xth6apxmcmw4scbpj	SKU-ij9hrj5xth6apxmcmw4scbpj	1463	EUR	100	0	\N	t	2025-11-25 15:00:30.599	2025-11-25 15:00:30.599	\N
tdg1jbj7vmxl684jmczpsntj	nrvc77uqaawbor31e1bx4c9a	zhwlj15y0ngwu3or29tzxvhy	SKU-zhwlj15y0ngwu3or29tzxvhy	1890	EUR	100	0	\N	t	2025-11-25 15:00:31.24	2025-11-25 15:00:31.24	\N
y3q01wis7c2ae2z3uxnztt2b	nrvc77uqaawbor31e1bx4c9a	warazrp8wd6xepxwef2ewns5	SKU-warazrp8wd6xepxwef2ewns5	2903	EUR	100	0	\N	t	2025-11-25 15:00:31.878	2025-11-25 15:00:31.878	\N
jrc64ok3nej532hpeelov4oq	nrvc77uqaawbor31e1bx4c9a	a0enniyyo16lwxca1kmhtcdv	SKU-a0enniyyo16lwxca1kmhtcdv	1463	EUR	100	0	\N	t	2025-11-25 15:00:32.516	2025-11-25 15:00:32.516	\N
havdq6waombeqjkn5fyp784h	nrvc77uqaawbor31e1bx4c9a	xvpdjxnh4no064s7r5pfetyg	SKU-xvpdjxnh4no064s7r5pfetyg	4500	EUR	100	0	\N	t	2025-11-25 15:00:33.15	2025-11-25 15:00:33.15	\N
j8i2nuyuhp82i0fs11bjcjvf	nrvc77uqaawbor31e1bx4c9a	la17njkbnh8caou80hdqggwe	SKU-la17njkbnh8caou80hdqggwe	1875	EUR	100	0	\N	t	2025-11-25 15:00:33.84	2025-11-25 15:00:33.84	\N
s69bumytdse467xcvcgdzatn	nrvc77uqaawbor31e1bx4c9a	h4kn77bpz8wm0qyqmut6j9sn	SKU-h4kn77bpz8wm0qyqmut6j9sn	1875	EUR	100	0	\N	t	2025-11-25 15:00:34.477	2025-11-25 15:00:34.477	\N
ghoo9sbc73zaknuucarfzhw5	nrvc77uqaawbor31e1bx4c9a	vhy4tx55p1d4pniufc0v6dk3	SKU-vhy4tx55p1d4pniufc0v6dk3	1875	EUR	100	0	\N	t	2025-11-25 15:00:35.116	2025-11-25 15:00:35.116	\N
dvxi03l9o7gdxb03avqeovjo	nrvc77uqaawbor31e1bx4c9a	ihgiarludqtyi66sg79xnxxm	SKU-ihgiarludqtyi66sg79xnxxm	1875	EUR	100	0	\N	t	2025-11-25 15:00:35.761	2025-11-25 15:00:35.761	\N
obyg2qj2blfosgms6o70t9zz	nrvc77uqaawbor31e1bx4c9a	dy03c4ogvt10j6igzgc2oyuu	SKU-dy03c4ogvt10j6igzgc2oyuu	990	EUR	100	0	\N	t	2025-11-25 15:00:36.408	2025-11-25 15:00:36.408	\N
ryqlmxx7oqtl52g9319xk3le	nrvc77uqaawbor31e1bx4c9a	vn44hh94pc7jgnpgyec094dz	SKU-vn44hh94pc7jgnpgyec094dz	990	EUR	100	0	\N	t	2025-11-25 15:00:37.043	2025-11-25 15:00:37.043	\N
gr5ag4vm4qos1brld9mz2pto	nrvc77uqaawbor31e1bx4c9a	weqxjxb2kv5a0dsmq92xhb0c	SKU-weqxjxb2kv5a0dsmq92xhb0c	990	EUR	100	0	\N	t	2025-11-25 15:00:37.734	2025-11-25 15:00:37.734	\N
axiwm3dv4bnp4llsp4i64nf7	nrvc77uqaawbor31e1bx4c9a	ggowohd3ihrzysz2fk4m88xm	SKU-ggowohd3ihrzysz2fk4m88xm	990	EUR	100	0	\N	t	2025-11-25 15:00:38.45	2025-11-25 15:00:38.45	\N
m3ekihqdl7wochr4kin6l37l	nrvc77uqaawbor31e1bx4c9a	zl3pxuowk6fphesbs4i1ac7y	SKU-zl3pxuowk6fphesbs4i1ac7y	990	EUR	100	0	\N	t	2025-11-25 15:00:39.107	2025-11-25 15:00:39.107	\N
oj55gc1zh7wf7cyllnxsqjri	nrvc77uqaawbor31e1bx4c9a	ak6zhbjt3p5wy2l41l323gh6	SKU-ak6zhbjt3p5wy2l41l323gh6	1875	EUR	100	0	\N	t	2025-11-25 15:00:39.744	2025-11-25 15:00:39.744	\N
gkfs7pv2j26nhz2q9f6gwkt3	nrvc77uqaawbor31e1bx4c9a	h5krhwvimolsh71szjof6gzt	SKU-h5krhwvimolsh71szjof6gzt	1395	EUR	100	0	\N	t	2025-11-25 15:00:40.388	2025-11-25 15:00:40.388	\N
lbm2rm14csp7cd5tmmpiggxk	nrvc77uqaawbor31e1bx4c9a	nt23gghlrnmac42zl419e59g	SKU-nt23gghlrnmac42zl419e59g	4238	EUR	100	0	\N	t	2025-11-25 15:00:41.019	2025-11-25 15:00:41.019	\N
xpc1qjtrhtva5ycydq74w6ao	nrvc77uqaawbor31e1bx4c9a	gltwv74yoe2n3d1hskaycbsd	SKU-gltwv74yoe2n3d1hskaycbsd	3615	EUR	100	0	\N	t	2025-11-25 15:00:41.655	2025-11-25 15:00:41.655	\N
bbidox7zgbqbb6iyjp4r06vh	nrvc77uqaawbor31e1bx4c9a	sn0wwxa3lu4wqnhkgy8ws25d	SKU-sn0wwxa3lu4wqnhkgy8ws25d	11775	EUR	100	0	\N	t	2025-11-25 15:00:42.289	2025-11-25 15:00:42.289	\N
yqdmrdlpbqciizuw5z23b4b1	nrvc77uqaawbor31e1bx4c9a	hlav3i1hdy4kkbounqwd9382	SKU-hlav3i1hdy4kkbounqwd9382	3375	EUR	100	0	\N	t	2025-11-25 15:00:42.928	2025-11-25 15:00:42.928	\N
cpxgmnkv283o7b37fpqwdmy2	nrvc77uqaawbor31e1bx4c9a	akjqlojs9y2e4a2k39eu730x	SKU-akjqlojs9y2e4a2k39eu730x	7575	EUR	100	0	\N	t	2025-11-25 15:00:43.591	2025-11-25 15:00:43.591	\N
m9bseepqe73pph5f8tw13m3m	nrvc77uqaawbor31e1bx4c9a	ziiqutpp6aa31c59t49rjsd6	SKU-ziiqutpp6aa31c59t49rjsd6	1485	EUR	100	0	\N	t	2025-11-25 15:00:44.228	2025-11-25 15:00:44.228	\N
c1js0c8bzdaybkjc8rqsu3om	nrvc77uqaawbor31e1bx4c9a	dlohzek68m6ue6jb7gewjcyr	SKU-dlohzek68m6ue6jb7gewjcyr	855	EUR	100	0	\N	t	2025-11-25 15:00:44.941	2025-11-25 15:00:44.941	\N
ujohtd8sm94ptrycn9xq481h	nrvc77uqaawbor31e1bx4c9a	aixv0xs9wclkqwajna8jmwz1	SKU-aixv0xs9wclkqwajna8jmwz1	1110	EUR	100	0	\N	t	2025-11-25 15:00:45.58	2025-11-25 15:00:45.58	\N
uudeiscbwgavp8942pnacyj8	nrvc77uqaawbor31e1bx4c9a	i9gv0mljajdwgxpt5usqjo9w	SKU-i9gv0mljajdwgxpt5usqjo9w	1313	EUR	100	0	\N	t	2025-11-25 15:00:46.221	2025-11-25 15:00:46.221	\N
c8k4q4wsnvschhah3emcopgl	nrvc77uqaawbor31e1bx4c9a	ngbt95scjx55kz9vrhunolj7	SKU-ngbt95scjx55kz9vrhunolj7	3600	EUR	100	0	\N	t	2025-11-25 15:00:46.854	2025-11-25 15:00:46.854	\N
b8mkdw91ihr4kxypg0j0eisb	nrvc77uqaawbor31e1bx4c9a	h0gi4893btos6krc7be30vo9	SKU-h0gi4893btos6krc7be30vo9	48750	EUR	100	0	\N	t	2025-11-25 15:00:47.493	2025-11-25 15:00:47.493	\N
k7j37d8vuoxdxonz01b3ujhp	nrvc77uqaawbor31e1bx4c9a	us2opiem5ru7x7kuznzs530g	SKU-us2opiem5ru7x7kuznzs530g	9975	EUR	100	0	\N	t	2025-11-25 15:00:48.125	2025-11-25 15:00:48.125	\N
ahizw09ejj8g0srzxli6navb	nrvc77uqaawbor31e1bx4c9a	qm7jslhuarngylnb2tysfwkx	SKU-qm7jslhuarngylnb2tysfwkx	863	EUR	100	0	\N	t	2025-11-25 15:00:48.759	2025-11-25 15:00:48.759	\N
so19ghccn8eakf2730r9qp6x	nrvc77uqaawbor31e1bx4c9a	f650cm6nb7chamb7uv77ol32	SKU-f650cm6nb7chamb7uv77ol32	5100	EUR	100	0	\N	t	2025-11-25 15:00:49.392	2025-11-25 15:00:49.392	\N
j785krlo39sv155rrxvsdiqn	nrvc77uqaawbor31e1bx4c9a	lcczjo5prlmcxikse8trv1cn	SKU-lcczjo5prlmcxikse8trv1cn	5100	EUR	100	0	\N	t	2025-11-25 15:00:50.027	2025-11-25 15:00:50.027	\N
dj48imnfhzhfhduca3hrdd8b	nrvc77uqaawbor31e1bx4c9a	v2yru89lq2qcl5n36voiybzg	SKU-v2yru89lq2qcl5n36voiybzg	1163	EUR	100	0	\N	t	2025-11-25 15:00:50.658	2025-11-25 15:00:50.658	\N
wgd85mb6blopp8vdkrdh9d0e	nrvc77uqaawbor31e1bx4c9a	pl434b4i51ecg31i6ghfbpny	SKU-pl434b4i51ecg31i6ghfbpny	1298	EUR	100	0	\N	t	2025-11-25 15:00:51.293	2025-11-25 15:00:51.293	\N
v1qtgrlboynn6zzw3kjhl6u3	nrvc77uqaawbor31e1bx4c9a	g7j9lsp3bwrmywxeosiljajs	SKU-g7j9lsp3bwrmywxeosiljajs	975	EUR	100	0	\N	t	2025-11-25 15:00:51.928	2025-11-25 15:00:51.928	\N
u6rcvrqcs20w9ax14wbbrcr9	nrvc77uqaawbor31e1bx4c9a	djueqo456ohhdftzkm1o5tqf	SKU-djueqo456ohhdftzkm1o5tqf	1298	EUR	100	0	\N	t	2025-11-25 15:00:52.574	2025-11-25 15:00:52.574	\N
ek880vu89rluzupewmom2p5m	nrvc77uqaawbor31e1bx4c9a	fjo47vnuts17cg5sa3xxmv5x	SKU-fjo47vnuts17cg5sa3xxmv5x	1298	EUR	100	0	\N	t	2025-11-25 15:00:53.208	2025-11-25 15:00:53.208	\N
d2rf4ydueip6dphyhs6qhrk9	nrvc77uqaawbor31e1bx4c9a	c8wh5m34g0eti82osqyt4q35	SKU-c8wh5m34g0eti82osqyt4q35	2588	EUR	100	0	\N	t	2025-11-25 15:00:53.913	2025-11-25 15:00:53.913	\N
nke4fxqhbp3lp6q6oxll4f67	nrvc77uqaawbor31e1bx4c9a	vfp0844zlegfygmlb4qinrmb	SKU-vfp0844zlegfygmlb4qinrmb	1350	EUR	100	0	\N	t	2025-11-25 15:00:54.549	2025-11-25 15:00:54.549	\N
ym876a3cd3ycw5pqdktha68b	nrvc77uqaawbor31e1bx4c9a	f62lo78bl36j739g3dyetzae	SKU-f62lo78bl36j739g3dyetzae	6600	EUR	100	0	\N	t	2025-11-25 15:00:55.184	2025-11-25 15:00:55.184	\N
jg18ng6as3zktzw2cr2apkkn	nrvc77uqaawbor31e1bx4c9a	vbe2obzrjg4o3ysgrf86q3c4	SKU-vbe2obzrjg4o3ysgrf86q3c4	4275	EUR	100	0	\N	t	2025-11-25 15:00:55.827	2025-11-25 15:00:55.827	\N
ktz0ekb9dsgq04xvljpc3ydu	nrvc77uqaawbor31e1bx4c9a	jmzki4w0caw1enkclrw1oygx	SKU-jmzki4w0caw1enkclrw1oygx	4275	EUR	100	0	\N	t	2025-11-25 15:00:56.464	2025-11-25 15:00:56.464	\N
pqbkzbw860bxvyssvsc4a90s	nrvc77uqaawbor31e1bx4c9a	yjjs33shdhr3pid23mhfw8a3	SKU-yjjs33shdhr3pid23mhfw8a3	3458	EUR	100	0	\N	t	2025-11-25 15:00:57.099	2025-11-25 15:00:57.099	\N
ie4ipj7isw85u0pswp8th4h1	nrvc77uqaawbor31e1bx4c9a	nydstzzrq48z6wi44l2b5u03	SKU-nydstzzrq48z6wi44l2b5u03	12975	EUR	100	0	\N	t	2025-11-25 15:00:57.735	2025-11-25 15:00:57.735	\N
gp4kot6i8yfhz516zjk8bny8	nrvc77uqaawbor31e1bx4c9a	yatrv9ngmtxxl4w6j7yed591	SKU-yatrv9ngmtxxl4w6j7yed591	3450	EUR	100	0	\N	t	2025-11-25 15:00:58.379	2025-11-25 15:00:58.379	\N
t3i87inezvlgyl3jcvtqgofs	nrvc77uqaawbor31e1bx4c9a	sd84xvb3281vu08hdb136xoq	SKU-sd84xvb3281vu08hdb136xoq	1170	EUR	100	0	\N	t	2025-11-25 15:00:59.013	2025-11-25 15:00:59.013	\N
ybir697lmb7f2c9yx4r49j83	nrvc77uqaawbor31e1bx4c9a	on0ryqayxt3dmw5mkp2n2q68	SKU-on0ryqayxt3dmw5mkp2n2q68	1163	EUR	100	0	\N	t	2025-11-25 15:00:59.653	2025-11-25 15:00:59.653	\N
fmqdncmhyyb7t2vorzvap17r	nrvc77uqaawbor31e1bx4c9a	c4ow2h64us3nt1f4kha8hgzl	SKU-c4ow2h64us3nt1f4kha8hgzl	3825	EUR	100	0	\N	t	2025-11-25 15:01:00.295	2025-11-25 15:01:00.295	\N
rajy70pd0sliwjcstp0lq0l0	nrvc77uqaawbor31e1bx4c9a	rjyh9ucr9imezl9s5gim7kyj	SKU-rjyh9ucr9imezl9s5gim7kyj	1665	EUR	100	0	\N	t	2025-11-25 15:01:00.934	2025-11-25 15:01:00.934	\N
k2h2eezxqg3a9ke9wdq7wl7f	nrvc77uqaawbor31e1bx4c9a	q6q386nkda3z8cv125oi34in	SKU-q6q386nkda3z8cv125oi34in	2265	EUR	100	0	\N	t	2025-11-25 15:01:01.58	2025-11-25 15:01:01.58	\N
z4u7aaxopqhrcymnkeuz6bm0	nrvc77uqaawbor31e1bx4c9a	ayfjquw1dbzklsqzet96qmjy	SKU-ayfjquw1dbzklsqzet96qmjy	1193	EUR	100	0	\N	t	2025-11-25 15:01:02.211	2025-11-25 15:01:02.211	\N
maklmz9co5fx91ah1pz9jm8y	nrvc77uqaawbor31e1bx4c9a	x5nk7wq9uvo4hxo05eddff3d	SKU-x5nk7wq9uvo4hxo05eddff3d	1635	EUR	100	0	\N	t	2025-11-25 15:01:02.849	2025-11-25 15:01:02.849	\N
aqln0higguc84ucizwxb148x	nrvc77uqaawbor31e1bx4c9a	vxzaoeqpb795o242skrbckda	SKU-vxzaoeqpb795o242skrbckda	1328	EUR	100	0	\N	t	2025-11-25 15:01:03.483	2025-11-25 15:01:03.483	\N
nbxgcpy6my5onx6t8ctumbaj	nrvc77uqaawbor31e1bx4c9a	uaegijkvif2ffhsrhscxebda	SKU-uaegijkvif2ffhsrhscxebda	12375	EUR	100	0	\N	t	2025-11-25 15:01:04.121	2025-11-25 15:01:04.121	\N
ipvkqujq45il5ykgvnz5opul	nrvc77uqaawbor31e1bx4c9a	aj2gwkvv71x7qh4nipnvkqum	SKU-aj2gwkvv71x7qh4nipnvkqum	2498	EUR	100	0	\N	t	2025-11-25 15:01:04.754	2025-11-25 15:01:04.754	\N
ydzi6j28gew1ko2o9u61qmuy	nrvc77uqaawbor31e1bx4c9a	jz9p1yu9rvjaxio10fc27lel	SKU-jz9p1yu9rvjaxio10fc27lel	1523	EUR	100	0	\N	t	2025-11-25 15:01:05.394	2025-11-25 15:01:05.394	\N
jy4yfsubxn40lylqiz9fjxy0	nrvc77uqaawbor31e1bx4c9a	xmwyohd5cjwm5yeamphzo15o	SKU-xmwyohd5cjwm5yeamphzo15o	2700	EUR	100	0	\N	t	2025-11-25 15:01:06.032	2025-11-25 15:01:06.032	\N
br34upscq92chjd3fo1cxjnn	nrvc77uqaawbor31e1bx4c9a	rzunnnkwepxu0swmfoklieks	SKU-rzunnnkwepxu0swmfoklieks	1665	EUR	100	0	\N	t	2025-11-25 15:01:06.665	2025-11-25 15:01:06.665	\N
hf7f79xiqasz8fsd404hy0io	nrvc77uqaawbor31e1bx4c9a	hdu2ecrx7invu3srlcxtekc8	SKU-hdu2ecrx7invu3srlcxtekc8	1710	EUR	100	0	\N	t	2025-11-25 15:01:07.331	2025-11-25 15:01:07.331	\N
wgr6nvpagf7dv278jmht55v5	nrvc77uqaawbor31e1bx4c9a	nadi6j3jo3ie5t9a1vofaw95	SKU-nadi6j3jo3ie5t9a1vofaw95	1485	EUR	100	0	\N	t	2025-11-25 15:01:07.963	2025-11-25 15:01:07.963	\N
odn84be0hikvksq2jsie5xo9	nrvc77uqaawbor31e1bx4c9a	mcffdc4fm3gwg10q5pngzmta	SKU-mcffdc4fm3gwg10q5pngzmta	2295	EUR	100	0	\N	t	2025-11-25 15:01:08.673	2025-11-25 15:01:08.673	\N
uhntng8o0qcblyjibvevbkgd	nrvc77uqaawbor31e1bx4c9a	hq08kli4qdrk5m6lkrypei11	SKU-hq08kli4qdrk5m6lkrypei11	5138	EUR	100	0	\N	t	2025-11-25 15:01:09.311	2025-11-25 15:01:09.311	\N
pestqo3st1yjqaffuj3ganzf	nrvc77uqaawbor31e1bx4c9a	hmcpak4uo4tel5ivtin62qet	SKU-hmcpak4uo4tel5ivtin62qet	1725	EUR	100	0	\N	t	2025-11-25 15:01:09.967	2025-11-25 15:01:09.967	\N
jkdzwvnxpfjzws53e9j6kq7h	nrvc77uqaawbor31e1bx4c9a	gsb0ds1pnvutjr98ws5zik2d	SKU-gsb0ds1pnvutjr98ws5zik2d	1508	EUR	100	0	\N	t	2025-11-25 15:01:10.686	2025-11-25 15:01:10.686	\N
t2vpki4pe8pg1esclxye81pm	nrvc77uqaawbor31e1bx4c9a	mfsujmrzqlkc5ys3mw28iovf	SKU-mfsujmrzqlkc5ys3mw28iovf	3420	EUR	100	0	\N	t	2025-11-25 15:01:11.323	2025-11-25 15:01:11.323	\N
ezqrl9irqdlodyd09ugaz489	nrvc77uqaawbor31e1bx4c9a	rfuhxu3uwoh0d0pdrjg5oys6	SKU-rfuhxu3uwoh0d0pdrjg5oys6	4050	EUR	100	0	\N	t	2025-11-25 15:01:11.969	2025-11-25 15:01:11.969	\N
oeoyxixg0ga84leu8puc8tua	nrvc77uqaawbor31e1bx4c9a	ptew1c4nuqkbqxhekgwfwg03	SKU-ptew1c4nuqkbqxhekgwfwg03	1755	EUR	100	0	\N	t	2025-11-25 15:01:12.618	2025-11-25 15:01:12.618	\N
rmv4rp6q2j9ewdztxefd4q9h	nrvc77uqaawbor31e1bx4c9a	od5kqho2qi9tq6eko1c7uxa9	SKU-od5kqho2qi9tq6eko1c7uxa9	2025	EUR	100	0	\N	t	2025-11-25 15:01:13.253	2025-11-25 15:01:13.253	\N
pv5puz5yb1eo6gz0ty9xuj9m	nrvc77uqaawbor31e1bx4c9a	mxchjd46ro5namvye6si4mc4	SKU-mxchjd46ro5namvye6si4mc4	1163	EUR	100	0	\N	t	2025-11-25 15:01:13.891	2025-11-25 15:01:13.891	\N
z79x0zjhzgjraayosjjtvpnn	nrvc77uqaawbor31e1bx4c9a	fz1yibmdzoimgjnuqg7anndb	SKU-fz1yibmdzoimgjnuqg7anndb	1695	EUR	100	0	\N	t	2025-11-25 15:01:14.526	2025-11-25 15:01:14.526	\N
d3ldupqvwgorwpsbkm0pgrh2	nrvc77uqaawbor31e1bx4c9a	s4lhelfwfht8aqcn2ohk25dx	SKU-s4lhelfwfht8aqcn2ohk25dx	1913	EUR	100	0	\N	t	2025-11-25 15:01:15.165	2025-11-25 15:01:15.165	\N
tcrimchx5g6mondwx7473nzx	nrvc77uqaawbor31e1bx4c9a	ox8kn8ju1toxz8se92j2x5g3	SKU-ox8kn8ju1toxz8se92j2x5g3	2925	EUR	100	0	\N	t	2025-11-25 15:01:15.8	2025-11-25 15:01:15.8	\N
zkjpprc7nahj0zrmgccro5en	nrvc77uqaawbor31e1bx4c9a	ei09vxmn3eth728rseygoikq	SKU-ei09vxmn3eth728rseygoikq	3105	EUR	100	0	\N	t	2025-11-25 15:01:16.439	2025-11-25 15:01:16.439	\N
urfx3udfyi4w0m9mabnayhzz	nrvc77uqaawbor31e1bx4c9a	vn5915gwjkmegs7fmkkwpaas	SKU-vn5915gwjkmegs7fmkkwpaas	2925	EUR	100	0	\N	t	2025-11-25 15:01:17.082	2025-11-25 15:01:17.082	\N
xa20x81uekrg3ixo9nbc3ezu	nrvc77uqaawbor31e1bx4c9a	v67nxs4j2381vuss53w21edw	SKU-v67nxs4j2381vuss53w21edw	3023	EUR	100	0	\N	t	2025-11-25 15:01:17.721	2025-11-25 15:01:17.721	\N
drevvpmc5m5x8ziswuc9baci	nrvc77uqaawbor31e1bx4c9a	pxw2nf936bhtagz8nuajxy1v	SKU-pxw2nf936bhtagz8nuajxy1v	4365	EUR	100	0	\N	t	2025-11-25 15:01:18.361	2025-11-25 15:01:18.361	\N
o8v3vf8em951j36qd6etdhs4	nrvc77uqaawbor31e1bx4c9a	u57b8xvccy939499fohbg04h	SKU-u57b8xvccy939499fohbg04h	2700	EUR	100	0	\N	t	2025-11-25 15:01:18.995	2025-11-25 15:01:18.995	\N
p4ug25ce3aqgiohzcxfuxfui	nrvc77uqaawbor31e1bx4c9a	f6kctxnuqwkajdwczav54ssf	SKU-f6kctxnuqwkajdwczav54ssf	5723	EUR	100	0	\N	t	2025-11-25 15:01:19.634	2025-11-25 15:01:19.634	\N
t58qdapm4vo9j07e6lthn7o3	nrvc77uqaawbor31e1bx4c9a	ut2gmwtvz4u4rdn979pqu3i8	SKU-ut2gmwtvz4u4rdn979pqu3i8	3143	EUR	100	0	\N	t	2025-11-25 15:01:20.278	2025-11-25 15:01:20.278	\N
ldx82wluourlbcnakljm4if5	nrvc77uqaawbor31e1bx4c9a	t9j8ok3p825kk00w1jrkyfr8	SKU-t9j8ok3p825kk00w1jrkyfr8	4133	EUR	100	0	\N	t	2025-11-25 15:01:20.914	2025-11-25 15:01:20.914	\N
j3us9olvrivg1l8c2hopozua	nrvc77uqaawbor31e1bx4c9a	capb7lti7wn5fn1gwsdzkfi4	SKU-capb7lti7wn5fn1gwsdzkfi4	3713	EUR	100	0	\N	t	2025-11-25 15:01:21.554	2025-11-25 15:01:21.554	\N
uly6i3k08qrzg973jhewcv9v	nrvc77uqaawbor31e1bx4c9a	w33enzldgejcpditx9lm4s3p	SKU-w33enzldgejcpditx9lm4s3p	1095	EUR	100	0	\N	t	2025-11-25 15:01:22.249	2025-11-25 15:01:22.249	\N
srev94viwywqwvd1ds4075fl	nrvc77uqaawbor31e1bx4c9a	ke2rvgvf7fremnlhqjxrj49e	SKU-ke2rvgvf7fremnlhqjxrj49e	3300	EUR	100	0	\N	t	2025-11-25 15:01:22.89	2025-11-25 15:01:22.89	\N
cv1q0sbnzjrs77j9tkvsiouf	nrvc77uqaawbor31e1bx4c9a	wc0wqtkt54cxxhzvgw3zney5	SKU-wc0wqtkt54cxxhzvgw3zney5	2595	EUR	100	0	\N	t	2025-11-25 15:01:23.604	2025-11-25 15:01:23.604	\N
vvx1bry5og650esoj2ot4w6g	nrvc77uqaawbor31e1bx4c9a	eztpsgtdnarhy0uaah0hf9j8	SKU-eztpsgtdnarhy0uaah0hf9j8	3045	EUR	100	0	\N	t	2025-11-25 15:01:24.243	2025-11-25 15:01:24.243	\N
xlo3v2jo0ysirg5os66444x6	nrvc77uqaawbor31e1bx4c9a	gqs8rwq0wggmpp21dxy5zh6m	SKU-gqs8rwq0wggmpp21dxy5zh6m	4875	EUR	100	0	\N	t	2025-11-25 15:01:24.883	2025-11-25 15:01:24.883	\N
owv0cofvwur16madptx5d3gd	nrvc77uqaawbor31e1bx4c9a	p9w8e9i8t3xluix2mddb234i	SKU-p9w8e9i8t3xluix2mddb234i	1478	EUR	100	0	\N	t	2025-11-25 15:01:25.568	2025-11-25 15:01:25.568	\N
a6htyt70ee0sjakyavzr9zfj	nrvc77uqaawbor31e1bx4c9a	mh2eyufgykv3aijioo8wogqa	SKU-mh2eyufgykv3aijioo8wogqa	1290	EUR	100	0	\N	t	2025-11-25 15:01:26.203	2025-11-25 15:01:26.203	\N
n78sd0zeppnjuo4edrx6n10x	nrvc77uqaawbor31e1bx4c9a	yruuducnx1a8q8nj7xcifkym	SKU-yruuducnx1a8q8nj7xcifkym	1530	EUR	100	0	\N	t	2025-11-25 15:01:26.84	2025-11-25 15:01:26.84	\N
kctlnkmml7id83jdtfe9o591	nrvc77uqaawbor31e1bx4c9a	s9yxjyib0x6jy824gtbmbz8k	SKU-s9yxjyib0x6jy824gtbmbz8k	3495	EUR	100	0	\N	t	2025-11-25 15:01:27.479	2025-11-25 15:01:27.479	\N
olkvty3z6ofzgbqqu8nygau9	nrvc77uqaawbor31e1bx4c9a	idz08h0048iu8msm1lk9sep8	SKU-idz08h0048iu8msm1lk9sep8	2070	EUR	100	0	\N	t	2025-11-25 15:01:28.118	2025-11-25 15:01:28.118	\N
c5t3nbgb2anofx6rpjo9eb1x	nrvc77uqaawbor31e1bx4c9a	ws5dwtsf2hu3l3j9q0be1u6p	SKU-ws5dwtsf2hu3l3j9q0be1u6p	2355	EUR	100	0	\N	t	2025-11-25 15:01:28.756	2025-11-25 15:01:28.756	\N
eka88xm98ualj8n9n2id7ih9	nrvc77uqaawbor31e1bx4c9a	ggjrztij38ohum46smdzolk0	SKU-ggjrztij38ohum46smdzolk0	3713	EUR	100	0	\N	t	2025-11-25 15:01:29.392	2025-11-25 15:01:29.392	\N
sxvr6pmp77jr3y4v1gw12gfo	nrvc77uqaawbor31e1bx4c9a	ti2sa6aw8eczr7bz6pmp8a47	SKU-ti2sa6aw8eczr7bz6pmp8a47	3375	EUR	100	0	\N	t	2025-11-25 15:01:30.027	2025-11-25 15:01:30.027	\N
in0ere77eurl53ozulxx9526	nrvc77uqaawbor31e1bx4c9a	lzavps34sm21zcq9qtckakfp	SKU-lzavps34sm21zcq9qtckakfp	3098	EUR	100	0	\N	t	2025-11-25 15:01:30.662	2025-11-25 15:01:30.662	\N
e45y7aeg56467vc304tranad	nrvc77uqaawbor31e1bx4c9a	cb0nzw2884pm1qvtu2k2hifg	SKU-cb0nzw2884pm1qvtu2k2hifg	1733	EUR	100	0	\N	t	2025-11-25 15:01:31.364	2025-11-25 15:01:31.364	\N
hx9i8q1nu1x50fzuov0gjk23	nrvc77uqaawbor31e1bx4c9a	yolit8x7mm95d8jt7r8167rs	SKU-yolit8x7mm95d8jt7r8167rs	2400	EUR	100	0	\N	t	2025-11-25 15:01:31.998	2025-11-25 15:01:31.998	\N
abwjigpyd7kykxi6p59vb9hy	nrvc77uqaawbor31e1bx4c9a	bz76v3rwgqqjc82ocwx6cxpb	SKU-bz76v3rwgqqjc82ocwx6cxpb	1995	EUR	100	0	\N	t	2025-11-25 15:01:32.638	2025-11-25 15:01:32.638	\N
orw3plqjnzrab3jwf926384f	nrvc77uqaawbor31e1bx4c9a	g2if3hsr7yqysqbjhautvso1	SKU-g2if3hsr7yqysqbjhautvso1	1478	EUR	100	0	\N	t	2025-11-25 15:01:33.275	2025-11-25 15:01:33.275	\N
xoa0ev9tlp8nf50wqc6xmrfp	nrvc77uqaawbor31e1bx4c9a	qnu24qdsapq4cxfb657pyuav	SKU-qnu24qdsapq4cxfb657pyuav	6900	EUR	100	0	\N	t	2025-11-25 15:01:33.931	2025-11-25 15:01:33.931	\N
jyqzf77ofevvhtwazrdgsuop	nrvc77uqaawbor31e1bx4c9a	jgjdk2awhezski05tm0z56f8	SKU-jgjdk2awhezski05tm0z56f8	2550	EUR	100	0	\N	t	2025-11-25 15:01:34.559	2025-11-25 15:01:34.559	\N
bhbt2bpugieat8b8oufzuv92	nrvc77uqaawbor31e1bx4c9a	h0fjkqfzfnvtgqtgejexem9z	SKU-h0fjkqfzfnvtgqtgejexem9z	2183	EUR	100	0	\N	t	2025-11-25 15:01:35.204	2025-11-25 15:01:35.204	\N
nvxsoar1hssgaak50spfog33	nrvc77uqaawbor31e1bx4c9a	fm3uvdu2ol0mjjqallwx6nxz	SKU-fm3uvdu2ol0mjjqallwx6nxz	2183	EUR	100	0	\N	t	2025-11-25 15:01:35.838	2025-11-25 15:01:35.838	\N
ytjkx1no3vpj9wi7d11ihibw	nrvc77uqaawbor31e1bx4c9a	g8fkkgmrlzdgnmxwqunax8tl	SKU-g8fkkgmrlzdgnmxwqunax8tl	1448	EUR	100	0	\N	t	2025-11-25 15:01:36.474	2025-11-25 15:01:36.474	\N
b61fbkaqjkdjdjmnypp5fuh9	nrvc77uqaawbor31e1bx4c9a	elg4k4ekraylnxuhtb5clmy0	SKU-elg4k4ekraylnxuhtb5clmy0	1260	EUR	100	0	\N	t	2025-11-25 15:01:37.113	2025-11-25 15:01:37.113	\N
r73plj77lyr2k0q7qpkahc57	nrvc77uqaawbor31e1bx4c9a	k95oepunqzm5wo5jpqe135ri	SKU-k95oepunqzm5wo5jpqe135ri	2265	EUR	100	0	\N	t	2025-11-25 15:01:37.759	2025-11-25 15:01:37.759	\N
t0ixeaw1r5218laim5kf2hjb	nrvc77uqaawbor31e1bx4c9a	xf7ncivz4lm58grhbwvugf24	SKU-xf7ncivz4lm58grhbwvugf24	2528	EUR	100	0	\N	t	2025-11-25 15:01:38.403	2025-11-25 15:01:38.403	\N
nd7y5patp34e5rlozxufwmni	nrvc77uqaawbor31e1bx4c9a	czoaod01amkksja3k5mo9unu	SKU-czoaod01amkksja3k5mo9unu	1770	EUR	100	0	\N	t	2025-11-25 15:01:39.105	2025-11-25 15:01:39.105	\N
pogd00xwun59fztfvfj950l6	nrvc77uqaawbor31e1bx4c9a	ndplcenot7vv3h6s40k0b5vc	SKU-ndplcenot7vv3h6s40k0b5vc	5873	EUR	100	0	\N	t	2025-11-25 15:01:39.749	2025-11-25 15:01:39.749	\N
b22jaxnzoo86e2g5gyv1ywm7	nrvc77uqaawbor31e1bx4c9a	dq1gwt3wy1k7na4gfuua8agr	SKU-dq1gwt3wy1k7na4gfuua8agr	1275	EUR	100	0	\N	t	2025-11-25 15:01:40.384	2025-11-25 15:01:40.384	\N
wqf1xrmxra16m1mut2ka49od	nrvc77uqaawbor31e1bx4c9a	xsd70l8b5idjcqd7idpbs8jl	SKU-xsd70l8b5idjcqd7idpbs8jl	1500	EUR	100	0	\N	t	2025-11-25 15:01:41.028	2025-11-25 15:01:41.028	\N
cot5y1wdgnh4og47z7ad987c	nrvc77uqaawbor31e1bx4c9a	ch2cvo5bil8pxbbcpbo6dzau	SKU-ch2cvo5bil8pxbbcpbo6dzau	2445	EUR	100	0	\N	t	2025-11-25 15:01:41.666	2025-11-25 15:01:41.666	\N
qli1a5lijmxsejjeqj4fziff	nrvc77uqaawbor31e1bx4c9a	t8gsbc6c21bga4mrc24rlylh	SKU-t8gsbc6c21bga4mrc24rlylh	1223	EUR	100	0	\N	t	2025-11-25 15:01:42.305	2025-11-25 15:01:42.305	\N
f97f7gq9usbymf3votwuqkom	nrvc77uqaawbor31e1bx4c9a	opufnrler2f5m3dqo9ck0j72	SKU-opufnrler2f5m3dqo9ck0j72	1613	EUR	100	0	\N	t	2025-11-25 15:01:42.948	2025-11-25 15:01:42.948	\N
zv2ew8se1l6tanbaq2aamgti	nrvc77uqaawbor31e1bx4c9a	f5390azk28c10qkygx1g0gkt	SKU-f5390azk28c10qkygx1g0gkt	8888	EUR	100	0	\N	t	2025-11-25 15:01:43.586	2025-11-25 15:01:43.586	\N
d5mhplyegze2952gwv52nuri	nrvc77uqaawbor31e1bx4c9a	ye1bfe25xuopeuxs57c6ecgc	SKU-ye1bfe25xuopeuxs57c6ecgc	5663	EUR	100	0	\N	t	2025-11-25 15:01:44.228	2025-11-25 15:01:44.228	\N
a6qeaxe4osnsxxtx81qeqi4k	nrvc77uqaawbor31e1bx4c9a	mpmj6fey3wwhd80186were23	SKU-mpmj6fey3wwhd80186were23	1740	EUR	100	0	\N	t	2025-11-25 15:01:44.868	2025-11-25 15:01:44.868	\N
r5312mmm14apemmyapc36dli	nrvc77uqaawbor31e1bx4c9a	i6yakqf6tkqocdpl02mji3y7	SKU-i6yakqf6tkqocdpl02mji3y7	7125	EUR	100	0	\N	t	2025-11-25 15:01:45.5	2025-11-25 15:01:45.5	\N
egt28ae6rnsqj4xpz5zumajl	nrvc77uqaawbor31e1bx4c9a	pe6qkpvqp8ax0dtmgz9ikjcg	SKU-pe6qkpvqp8ax0dtmgz9ikjcg	3188	EUR	100	0	\N	t	2025-11-25 15:01:46.264	2025-11-25 15:01:46.264	\N
dwrebska4esyopmc4seuankk	nrvc77uqaawbor31e1bx4c9a	nrn65vxbdxd4nzgloe9boynx	SKU-nrn65vxbdxd4nzgloe9boynx	3840	EUR	100	0	\N	t	2025-11-25 15:01:46.921	2025-11-25 15:01:46.921	\N
r98mectp7cdqykjca9fjyohe	nrvc77uqaawbor31e1bx4c9a	m5nmri2fvk141bg8ry4csa69	SKU-m5nmri2fvk141bg8ry4csa69	3338	EUR	100	0	\N	t	2025-11-25 15:01:47.56	2025-11-25 15:01:47.56	\N
o3uxxvq2li7q186qykzs7p30	nrvc77uqaawbor31e1bx4c9a	detqrf6ixxyxm0pxlw59hw3b	SKU-detqrf6ixxyxm0pxlw59hw3b	4425	EUR	100	0	\N	t	2025-11-25 15:01:48.201	2025-11-25 15:01:48.201	\N
qhdiuqomueutm2ef85140jmk	nrvc77uqaawbor31e1bx4c9a	qs9t0f2c3i79plrglq5q1zrx	SKU-qs9t0f2c3i79plrglq5q1zrx	3105	EUR	100	0	\N	t	2025-11-25 15:01:48.834	2025-11-25 15:01:48.834	\N
xh42m4rcgu20oea6qhxb107l	nrvc77uqaawbor31e1bx4c9a	dkekt21yf53zjuk9f7ddwhdw	SKU-dkekt21yf53zjuk9f7ddwhdw	4425	EUR	100	0	\N	t	2025-11-25 15:01:49.48	2025-11-25 15:01:49.48	\N
zavlhb5u8pcdekqeumzy100z	nrvc77uqaawbor31e1bx4c9a	dlmrsoksrfii21zugkya4sw6	SKU-dlmrsoksrfii21zugkya4sw6	1538	EUR	100	0	\N	t	2025-11-25 15:01:50.126	2025-11-25 15:01:50.126	\N
qtosnerm16ckibulps12vx59	nrvc77uqaawbor31e1bx4c9a	r5jhecqpb2ygneepfv8fhj35	SKU-r5jhecqpb2ygneepfv8fhj35	2048	EUR	100	0	\N	t	2025-11-25 15:01:50.774	2025-11-25 15:01:50.774	\N
rcrp61w9y4m1ssfqjk3gvz1q	nrvc77uqaawbor31e1bx4c9a	mw1p2wic5gvbm01y3nxjytnx	SKU-mw1p2wic5gvbm01y3nxjytnx	1200	EUR	100	0	\N	t	2025-11-25 15:01:51.414	2025-11-25 15:01:51.414	\N
uv09mc00oisnzi86b80uho72	nrvc77uqaawbor31e1bx4c9a	m7ewpal4rrc9lsbom4t69ctk	SKU-m7ewpal4rrc9lsbom4t69ctk	3938	EUR	100	0	\N	t	2025-11-25 15:01:52.061	2025-11-25 15:01:52.061	\N
t7dmxyo0boagziw8mu350aot	nrvc77uqaawbor31e1bx4c9a	xjtjy17zyzljlelfpj8pyojg	SKU-xjtjy17zyzljlelfpj8pyojg	1800	EUR	100	0	\N	t	2025-11-25 15:01:52.698	2025-11-25 15:01:52.698	\N
kbtsl8vayw9a7kvzf0417quj	nrvc77uqaawbor31e1bx4c9a	tck223snxaz7bzre57u1yvhj	SKU-tck223snxaz7bzre57u1yvhj	1635	EUR	100	0	\N	t	2025-11-25 15:01:53.34	2025-11-25 15:01:53.34	\N
zz71a1kq3uh1c8cgoh2tpsix	nrvc77uqaawbor31e1bx4c9a	fawhr7cx45gc84ax4jcv7xph	SKU-fawhr7cx45gc84ax4jcv7xph	3435	EUR	100	0	\N	t	2025-11-25 15:01:54.045	2025-11-25 15:01:54.045	\N
z75rlberi30wk9suij5j9t8x	nrvc77uqaawbor31e1bx4c9a	kr93x4b5bculiy6qksxvkh3s	SKU-kr93x4b5bculiy6qksxvkh3s	1920	EUR	100	0	\N	t	2025-11-25 15:01:54.681	2025-11-25 15:01:54.681	\N
j9cs0hexnekixsdro7hv2j8j	nrvc77uqaawbor31e1bx4c9a	o6w35sr16yqnyd1egyimkbh4	SKU-o6w35sr16yqnyd1egyimkbh4	1073	EUR	100	0	\N	t	2025-11-25 15:01:55.319	2025-11-25 15:01:55.319	\N
zfm5pb3liijgfs4vuopea709	nrvc77uqaawbor31e1bx4c9a	dcug1vfoewn2c0cj3tftgmk7	SKU-dcug1vfoewn2c0cj3tftgmk7	3713	EUR	100	0	\N	t	2025-11-25 15:01:55.953	2025-11-25 15:01:55.953	\N
gd4jmj2rf8mbiyhyon80nrfw	nrvc77uqaawbor31e1bx4c9a	c4cg9yyuywmacorkvgu0w008	SKU-c4cg9yyuywmacorkvgu0w008	5685	EUR	100	0	\N	t	2025-11-25 15:01:56.594	2025-11-25 15:01:56.594	\N
t3ywn6cgullgrz1it00up8um	nrvc77uqaawbor31e1bx4c9a	lowj85t4qc9qqdshnwne7aoi	SKU-lowj85t4qc9qqdshnwne7aoi	13575	EUR	100	0	\N	t	2025-11-25 15:01:57.234	2025-11-25 15:01:57.234	\N
wvxlga73opzc7uy2gah61v20	nrvc77uqaawbor31e1bx4c9a	xj4xzzf8ntj91sg4z7k2nreu	SKU-xj4xzzf8ntj91sg4z7k2nreu	1298	EUR	100	0	\N	t	2025-11-25 15:01:57.883	2025-11-25 15:01:57.883	\N
tp7nm8knj715ijz3i5b7eypt	nrvc77uqaawbor31e1bx4c9a	pt6pj8bqy0x2z532pv4ejska	SKU-pt6pj8bqy0x2z532pv4ejska	1650	EUR	100	0	\N	t	2025-11-25 15:01:58.518	2025-11-25 15:01:58.518	\N
ndt3qpc8q4wesf42qlaww2q9	nrvc77uqaawbor31e1bx4c9a	fdo4hbmu5fmoe0tl3v4znov1	SKU-fdo4hbmu5fmoe0tl3v4znov1	1950	EUR	100	0	\N	t	2025-11-25 15:01:59.152	2025-11-25 15:01:59.152	\N
bicfe3gv0d5yc6ib0e9024ii	nrvc77uqaawbor31e1bx4c9a	lswkm21refbkkjv6n9kz1vvw	SKU-lswkm21refbkkjv6n9kz1vvw	1650	EUR	100	0	\N	t	2025-11-25 15:01:59.786	2025-11-25 15:01:59.786	\N
ond1ubnv867lqz09x86nvz8u	nrvc77uqaawbor31e1bx4c9a	kwdn0x3ksqufbh9sec5rg97l	SKU-kwdn0x3ksqufbh9sec5rg97l	1650	EUR	100	0	\N	t	2025-11-25 15:02:00.429	2025-11-25 15:02:00.429	\N
m0m6pvoexvxxeqr999ytaqu5	nrvc77uqaawbor31e1bx4c9a	fyh6hkfn4ehqwszjfifxds33	SKU-fyh6hkfn4ehqwszjfifxds33	1650	EUR	100	0	\N	t	2025-11-25 15:02:01.077	2025-11-25 15:02:01.077	\N
ab73n8ltn3rccptz1lb66kws	nrvc77uqaawbor31e1bx4c9a	sfxhhsnqhdibhx1pyjhwq9xy	SKU-sfxhhsnqhdibhx1pyjhwq9xy	1950	EUR	100	0	\N	t	2025-11-25 15:02:01.756	2025-11-25 15:02:01.756	\N
hfjets5soc19c06ucl4fhicm	nrvc77uqaawbor31e1bx4c9a	pl3nlburwfskd0ela1d8jtri	SKU-pl3nlburwfskd0ela1d8jtri	1950	EUR	100	0	\N	t	2025-11-25 15:02:02.399	2025-11-25 15:02:02.399	\N
vl7jvgtzm113c0w2n6myml2c	nrvc77uqaawbor31e1bx4c9a	eak7hrsoxi52kl39tyv0pmp5	SKU-eak7hrsoxi52kl39tyv0pmp5	1650	EUR	100	0	\N	t	2025-11-25 15:02:03.034	2025-11-25 15:02:03.034	\N
vtbk128raelu9dm9njqcqc6m	nrvc77uqaawbor31e1bx4c9a	yqez3hir5wh8pk25px2tugrq	SKU-yqez3hir5wh8pk25px2tugrq	1215	EUR	100	0	\N	t	2025-11-25 15:02:03.674	2025-11-25 15:02:03.674	\N
c065hnf8pn4dkkmswsuh9zvp	nrvc77uqaawbor31e1bx4c9a	ui2lovakvb3bjgvwjbw5dqcy	SKU-ui2lovakvb3bjgvwjbw5dqcy	975	EUR	100	0	\N	t	2025-11-25 15:02:04.308	2025-11-25 15:02:04.308	\N
erqsv4ap245jfc9w1kqmmniz	nrvc77uqaawbor31e1bx4c9a	ktdvl7579o0yckkll20qvaxe	SKU-ktdvl7579o0yckkll20qvaxe	975	EUR	100	0	\N	t	2025-11-25 15:02:04.947	2025-11-25 15:02:04.947	\N
gnlxa9jupu49zr3gfu40g9if	nrvc77uqaawbor31e1bx4c9a	ygaw0xkeeis1xbcx075mhxdt	SKU-ygaw0xkeeis1xbcx075mhxdt	975	EUR	100	0	\N	t	2025-11-25 15:02:05.584	2025-11-25 15:02:05.584	\N
k30kb63xe7tvpvh0olx0w3q1	nrvc77uqaawbor31e1bx4c9a	nn7rhjpqo0ubamomgrrkhz3a	SKU-nn7rhjpqo0ubamomgrrkhz3a	524	EUR	100	0	\N	t	2025-11-25 15:08:53.399	2025-11-25 15:08:53.399	\N
hwkoox7cdsi8ggnbk9xzib28	nrvc77uqaawbor31e1bx4c9a	cy8wkeka1b6zs86bniq7sege	SKU-cy8wkeka1b6zs86bniq7sege	538	EUR	100	0	\N	t	2025-11-25 15:08:54.11	2025-11-25 15:08:54.11	\N
mkihi4ud891nb7wrn426xldv	nrvc77uqaawbor31e1bx4c9a	kgw7ag5wwqxyrgmbtydmev1f	SKU-kgw7ag5wwqxyrgmbtydmev1f	672	EUR	100	0	\N	t	2025-11-25 15:08:54.774	2025-11-25 15:08:54.774	\N
vz17sisv2qxsiz2of2qbvlw5	nrvc77uqaawbor31e1bx4c9a	jej409k7zfnbm6n2fls32sy5	SKU-jej409k7zfnbm6n2fls32sy5	2295	EUR	100	0	\N	t	2025-11-25 15:08:55.433	2025-11-25 15:08:55.433	\N
eqs7z9ulw22m4f6u0mx1ldob	nrvc77uqaawbor31e1bx4c9a	xfympqkpy66u4cigvv47u3cb	SKU-xfympqkpy66u4cigvv47u3cb	808	EUR	100	0	\N	t	2025-11-25 15:08:56.077	2025-11-25 15:08:56.077	\N
mkqym8rhyqanlztzmcmg4e4o	nrvc77uqaawbor31e1bx4c9a	a4d7zmlsxlrdrndno9ffs0vn	SKU-a4d7zmlsxlrdrndno9ffs0vn	2270	EUR	100	0	\N	t	2025-11-25 15:08:56.73	2025-11-25 15:08:56.73	\N
bgfy61kp4hlrq9ftu4icclv9	nrvc77uqaawbor31e1bx4c9a	ua9996uqg2zpzleou6u9e263	SKU-ua9996uqg2zpzleou6u9e263	1279	EUR	100	0	\N	t	2025-11-25 15:08:57.457	2025-11-25 15:08:57.457	\N
vxu9d7viodmkwjniywxwy5vd	nrvc77uqaawbor31e1bx4c9a	lnqrmqfoqlh3cdt7gfyq7pzv	SKU-lnqrmqfoqlh3cdt7gfyq7pzv	1279	EUR	100	0	\N	t	2025-11-25 15:08:58.093	2025-11-25 15:08:58.093	\N
ek1ellfpyzhzgbi83sgvie4j	nrvc77uqaawbor31e1bx4c9a	ead59z5e1ttuxoydknpikr0q	SKU-ead59z5e1ttuxoydknpikr0q	1360	EUR	100	0	\N	t	2025-11-25 15:08:58.727	2025-11-25 15:08:58.727	\N
z4qeb5erho4bevc1a7bhu2q6	nrvc77uqaawbor31e1bx4c9a	m7fpipugpruyfkb8fxfvlquq	SKU-m7fpipugpruyfkb8fxfvlquq	1395	EUR	100	0	\N	t	2025-11-25 15:08:59.361	2025-11-25 15:08:59.361	\N
ektix7to7uut3bpg0i9wh676	nrvc77uqaawbor31e1bx4c9a	vw66eg631sv4xh5xsk3oj2nw	SKU-vw66eg631sv4xh5xsk3oj2nw	20400	EUR	100	0	\N	t	2025-11-25 15:08:59.995	2025-11-25 15:08:59.995	\N
i2ftnfpn6j5xoyrljxt5daa0	nrvc77uqaawbor31e1bx4c9a	blczs4yu6q2l2bqvioz984ie	SKU-blczs4yu6q2l2bqvioz984ie	30685	EUR	100	0	\N	t	2025-11-25 15:09:00.634	2025-11-25 15:09:00.634	\N
pgz3c7oshg0ns7s8w3t42wvt	nrvc77uqaawbor31e1bx4c9a	mwjpk3anbhuyt24zsb74kz6r	SKU-mwjpk3anbhuyt24zsb74kz6r	1360	EUR	100	0	\N	t	2025-11-25 15:09:01.375	2025-11-25 15:09:01.375	\N
nonipd6tfwn5pmdtp91w93jx	nrvc77uqaawbor31e1bx4c9a	vl7c3z71c303hcwi26se8xbb	SKU-vl7c3z71c303hcwi26se8xbb	966	EUR	100	0	\N	t	2025-11-25 15:09:02.019	2025-11-25 15:09:02.019	\N
jan4k1cuscf6uuwo431gpsih	nrvc77uqaawbor31e1bx4c9a	sjk5f877wixtwgk5r5jlv508	SKU-sjk5f877wixtwgk5r5jlv508	2423	EUR	100	0	\N	t	2025-11-25 15:09:02.65	2025-11-25 15:09:02.65	\N
k3tdl3wpc3cdnut2ee85wnvc	nrvc77uqaawbor31e1bx4c9a	uhfc33qu7axv4ckgr5hwvl23	SKU-uhfc33qu7axv4ckgr5hwvl23	2848	EUR	100	0	\N	t	2025-11-25 15:09:03.292	2025-11-25 15:09:03.292	\N
es967mmzspe3xbd6oo4nkfb7	nrvc77uqaawbor31e1bx4c9a	zby40ybj8rto21n6czhsnn97	SKU-zby40ybj8rto21n6czhsnn97	460	EUR	100	0	\N	t	2025-11-25 15:09:03.927	2025-11-25 15:09:03.927	\N
qzihwec8qyj9jfytkxt7x4ld	nrvc77uqaawbor31e1bx4c9a	sq9nvjdyukmuly98hw4bmpuu	SKU-sq9nvjdyukmuly98hw4bmpuu	874	EUR	100	0	\N	t	2025-11-25 15:09:04.57	2025-11-25 15:09:04.57	\N
jaxh068gc1jsjtp2c42qwzr4	nrvc77uqaawbor31e1bx4c9a	gtjfx1n238votf6zbmj14c8o	SKU-gtjfx1n238votf6zbmj14c8o	49300	EUR	100	0	\N	t	2025-11-25 15:09:05.239	2025-11-25 15:09:05.239	\N
whwlzlvuh2iyallixey6wamk	nrvc77uqaawbor31e1bx4c9a	j00xfcwcakfuo0nyxdlbg85k	SKU-j00xfcwcakfuo0nyxdlbg85k	813	EUR	100	0	\N	t	2025-11-25 15:09:05.877	2025-11-25 15:09:05.877	\N
jrsj027cyltawp4lhztzpdi8	nrvc77uqaawbor31e1bx4c9a	du7syx05envtiib6q55zs87f	SKU-du7syx05envtiib6q55zs87f	4675	EUR	100	0	\N	t	2025-11-25 15:09:06.547	2025-11-25 15:09:06.547	\N
a6a34wq47v4mksjusov4t22f	nrvc77uqaawbor31e1bx4c9a	hnujewckqrb8ys8zl3j3f1bk	SKU-hnujewckqrb8ys8zl3j3f1bk	772	EUR	100	0	\N	t	2025-11-25 15:09:07.185	2025-11-25 15:09:07.185	\N
zkwap3971k1w2ep88h85468h	nrvc77uqaawbor31e1bx4c9a	sm99lasznacftiuuo00faov6	SKU-sm99lasznacftiuuo00faov6	504	EUR	100	0	\N	t	2025-11-25 15:09:07.825	2025-11-25 15:09:07.825	\N
wm5a388rd4om1u4e7t11wgxd	nrvc77uqaawbor31e1bx4c9a	ttpize5jilp1md2fc4xvm90e	SKU-ttpize5jilp1md2fc4xvm90e	3060	EUR	100	0	\N	t	2025-11-25 15:09:08.476	2025-11-25 15:09:08.476	\N
zis14xnp82b2umu4koe4oyxc	nrvc77uqaawbor31e1bx4c9a	czuwhjanzoeexxde81pjwksf	SKU-czuwhjanzoeexxde81pjwksf	978	EUR	100	0	\N	t	2025-11-25 15:09:09.187	2025-11-25 15:09:09.187	\N
klybowiby68fbo25i28j42ub	nrvc77uqaawbor31e1bx4c9a	kfo280fcmd1actqm2ciiqmfr	SKU-kfo280fcmd1actqm2ciiqmfr	941	EUR	100	0	\N	t	2025-11-25 15:09:09.821	2025-11-25 15:09:09.821	\N
wft0yvk0n6pshunm5knwryze	nrvc77uqaawbor31e1bx4c9a	skvb5imcvv3ozl24a1uejx96	SKU-skvb5imcvv3ozl24a1uejx96	408	EUR	100	0	\N	t	2025-11-25 15:09:10.456	2025-11-25 15:09:10.456	\N
ao2hs8rpkl239i8qcqib40th	nrvc77uqaawbor31e1bx4c9a	kmsleva2b3lz4jnitxhxduoc	SKU-kmsleva2b3lz4jnitxhxduoc	2040	EUR	100	0	\N	t	2025-11-25 15:09:11.097	2025-11-25 15:09:11.097	\N
eake6zu7ij7r3j594p26nvwh	nrvc77uqaawbor31e1bx4c9a	ptkpopzo1u72c0sk2j2ie2b2	SKU-ptkpopzo1u72c0sk2j2ie2b2	2576	EUR	100	0	\N	t	2025-11-25 15:09:11.736	2025-11-25 15:09:11.736	\N
p7rg4iejdg8zvctvtotlf8od	nrvc77uqaawbor31e1bx4c9a	ry5qo1py51kexfbfqpokapt7	SKU-ry5qo1py51kexfbfqpokapt7	1216	EUR	100	0	\N	t	2025-11-25 15:09:12.378	2025-11-25 15:09:12.378	\N
nr8vu51b6u07gwjdbhic8stw	nrvc77uqaawbor31e1bx4c9a	xmolpd05pcqye0yqcdfj36cd	SKU-xmolpd05pcqye0yqcdfj36cd	3111	EUR	100	0	\N	t	2025-11-25 15:09:13.063	2025-11-25 15:09:13.063	\N
pci1pnuvccyi090d7g9t0i6f	nrvc77uqaawbor31e1bx4c9a	p90bp3e4a49nroun0ma150u0	SKU-p90bp3e4a49nroun0ma150u0	1573	EUR	100	0	\N	t	2025-11-25 15:09:13.704	2025-11-25 15:09:13.704	\N
ram1ft4gc7qr9namm9dgtl1i	nrvc77uqaawbor31e1bx4c9a	ep4iqyqf7ws9juyflzu1fz18	SKU-ep4iqyqf7ws9juyflzu1fz18	925	EUR	100	0	\N	t	2025-11-25 15:09:14.343	2025-11-25 15:09:14.343	\N
gnd2mqvw7r8ogf5jsfwvnsgf	nrvc77uqaawbor31e1bx4c9a	czdopz184uhvs5tvorxhau9u	SKU-czdopz184uhvs5tvorxhau9u	408	EUR	100	0	\N	t	2025-11-25 15:09:14.981	2025-11-25 15:09:14.981	\N
mhqqplvxg2vdvucmo2g1uvv1	nrvc77uqaawbor31e1bx4c9a	lzmwxcsk8b1eeslt9bjbt1on	SKU-lzmwxcsk8b1eeslt9bjbt1on	907	EUR	100	0	\N	t	2025-11-25 15:09:15.62	2025-11-25 15:09:15.62	\N
xk9b20hmtdzhcorsnahsp5d8	nrvc77uqaawbor31e1bx4c9a	s2dnoi7ge17htyx0j27vermz	SKU-s2dnoi7ge17htyx0j27vermz	1292	EUR	100	0	\N	t	2025-11-25 15:09:16.256	2025-11-25 15:09:16.256	\N
wsvgndzoktfzlt41fx95lx0p	nrvc77uqaawbor31e1bx4c9a	usg0ryyqkraw2obojea85160	SKU-usg0ryyqkraw2obojea85160	1310	EUR	100	0	\N	t	2025-11-25 15:09:16.894	2025-11-25 15:09:16.894	\N
qwvl3megtwb6657drw8a9o7g	nrvc77uqaawbor31e1bx4c9a	ff700y1romqg2trz85fxh9hw	SKU-ff700y1romqg2trz85fxh9hw	783	EUR	100	0	\N	t	2025-11-25 15:09:17.54	2025-11-25 15:09:17.54	\N
yrlbcgswo7swkt96czv7jlot	nrvc77uqaawbor31e1bx4c9a	i988sklqq2xtvzruvu287dsv	SKU-i988sklqq2xtvzruvu287dsv	1156	EUR	100	0	\N	t	2025-11-25 15:09:18.171	2025-11-25 15:09:18.171	\N
u5xry4h3if4t5yp3e2gz9t61	nrvc77uqaawbor31e1bx4c9a	ap0yzxkx3muyu07ggrf974tx	SKU-ap0yzxkx3muyu07ggrf974tx	975	EUR	100	0	\N	t	2025-11-25 15:02:06.221	2025-11-25 15:02:06.221	\N
q5rgffnq9512mttx8o5jtqcn	nrvc77uqaawbor31e1bx4c9a	zg4jaahmtks0jjj3hvpmsuyf	SKU-zg4jaahmtks0jjj3hvpmsuyf	975	EUR	100	0	\N	t	2025-11-25 15:02:06.857	2025-11-25 15:02:06.857	\N
tqg65kd2eg4qmvbm4mtjfdzg	nrvc77uqaawbor31e1bx4c9a	pmqg1iev0c6hjdn1z10c4xd3	SKU-pmqg1iev0c6hjdn1z10c4xd3	975	EUR	100	0	\N	t	2025-11-25 15:02:07.518	2025-11-25 15:02:07.518	\N
wdfb6bc8478wxqgc14ykn1rd	nrvc77uqaawbor31e1bx4c9a	mgd9acvli7xeoshwtrl13phu	SKU-mgd9acvli7xeoshwtrl13phu	975	EUR	100	0	\N	t	2025-11-25 15:02:08.157	2025-11-25 15:02:08.157	\N
wblemtf539eqrjdm40m2w5rt	nrvc77uqaawbor31e1bx4c9a	mbn1efzmyiydnpxyixl7iwab	SKU-mbn1efzmyiydnpxyixl7iwab	975	EUR	100	0	\N	t	2025-11-25 15:02:08.799	2025-11-25 15:02:08.799	\N
nea2j4p1emcw2cj7y3tg2x2e	nrvc77uqaawbor31e1bx4c9a	el550t09kafcqp7a8yrzoudj	SKU-el550t09kafcqp7a8yrzoudj	975	EUR	100	0	\N	t	2025-11-25 15:02:09.516	2025-11-25 15:02:09.516	\N
y3bksz0nnyl5kmm8ulb37m60	nrvc77uqaawbor31e1bx4c9a	knadrj65qwrhizavfxv5436o	SKU-knadrj65qwrhizavfxv5436o	975	EUR	100	0	\N	t	2025-11-25 15:02:10.149	2025-11-25 15:02:10.149	\N
z3qhn1d4nzfs6ojq4pcgbnm2	nrvc77uqaawbor31e1bx4c9a	s1icwj02zdxgk39n1ons0kvn	SKU-s1icwj02zdxgk39n1ons0kvn	975	EUR	100	0	\N	t	2025-11-25 15:02:10.819	2025-11-25 15:02:10.819	\N
dq6s0cps7x6ky8delox7wsov	nrvc77uqaawbor31e1bx4c9a	aui0m7aw9nesnup5fnubem5t	SKU-aui0m7aw9nesnup5fnubem5t	975	EUR	100	0	\N	t	2025-11-25 15:02:11.454	2025-11-25 15:02:11.454	\N
dygkdvpvzy4kwe49uv78ngr1	nrvc77uqaawbor31e1bx4c9a	dpjh8gfa4enpyo2hx9rjsg9s	SKU-dpjh8gfa4enpyo2hx9rjsg9s	975	EUR	100	0	\N	t	2025-11-25 15:02:12.089	2025-11-25 15:02:12.089	\N
rt651zs2zehnaw77isddfcui	nrvc77uqaawbor31e1bx4c9a	rl6x7q0vgz8b5sx7x3agxhvg	SKU-rl6x7q0vgz8b5sx7x3agxhvg	975	EUR	100	0	\N	t	2025-11-25 15:02:12.731	2025-11-25 15:02:12.731	\N
acsr0pzqop82og1oqz0h47h0	nrvc77uqaawbor31e1bx4c9a	d95o6ae1f49w0gv0dfge8wrw	SKU-d95o6ae1f49w0gv0dfge8wrw	975	EUR	100	0	\N	t	2025-11-25 15:02:13.473	2025-11-25 15:02:13.473	\N
h8io76wxndvly8r06qb3kzsx	nrvc77uqaawbor31e1bx4c9a	jcykpwyxrasqz1jwpclq26ki	SKU-jcykpwyxrasqz1jwpclq26ki	975	EUR	100	0	\N	t	2025-11-25 15:02:14.114	2025-11-25 15:02:14.114	\N
klq0efqdjql3qb0m9524ot1k	nrvc77uqaawbor31e1bx4c9a	i3ny98uerq3ioba8adgieear	SKU-i3ny98uerq3ioba8adgieear	975	EUR	100	0	\N	t	2025-11-25 15:02:14.747	2025-11-25 15:02:14.747	\N
r77mf0heplcjcava82qs3krp	nrvc77uqaawbor31e1bx4c9a	s4k5fdr56jsoas1ru1z0ggpz	SKU-s4k5fdr56jsoas1ru1z0ggpz	975	EUR	100	0	\N	t	2025-11-25 15:02:15.384	2025-11-25 15:02:15.384	\N
c8c25m215outqyqqk4h8ftr0	nrvc77uqaawbor31e1bx4c9a	xz5254cng9m1f7eiuuwb2j21	SKU-xz5254cng9m1f7eiuuwb2j21	533	EUR	100	0	\N	t	2025-11-25 15:02:16.066	2025-11-25 15:02:16.066	\N
zi8ntf86fvc9auv89hlp344v	nrvc77uqaawbor31e1bx4c9a	xxs87zxm195t7zv2hmea67lz	SKU-xxs87zxm195t7zv2hmea67lz	1043	EUR	100	0	\N	t	2025-11-25 15:02:16.703	2025-11-25 15:02:16.703	\N
uarucsu5hqfdzo96vq0vir37	nrvc77uqaawbor31e1bx4c9a	rwv5axknuv1m4uo6ixonpna2	SKU-rwv5axknuv1m4uo6ixonpna2	1043	EUR	100	0	\N	t	2025-11-25 15:02:17.34	2025-11-25 15:02:17.34	\N
hyfczg7ac7ts6c3zc03edaz5	nrvc77uqaawbor31e1bx4c9a	x5xy97latkmggh264xfl44hz	SKU-x5xy97latkmggh264xfl44hz	1043	EUR	100	0	\N	t	2025-11-25 15:02:18.049	2025-11-25 15:02:18.049	\N
slqoof8pp36bd9z1ze25nlhs	nrvc77uqaawbor31e1bx4c9a	kx90o5dgyv3izpgt59ngzble	SKU-kx90o5dgyv3izpgt59ngzble	1043	EUR	100	0	\N	t	2025-11-25 15:02:18.684	2025-11-25 15:02:18.684	\N
vk7r8z1toi98i5lf8v3h51bl	nrvc77uqaawbor31e1bx4c9a	porc99hbwzldukeos7wcewt6	SKU-porc99hbwzldukeos7wcewt6	1043	EUR	100	0	\N	t	2025-11-25 15:02:19.324	2025-11-25 15:02:19.324	\N
pym5z217ixj7mzhuqmazynkr	nrvc77uqaawbor31e1bx4c9a	c2vkhssa733okm0mduva16l2	SKU-c2vkhssa733okm0mduva16l2	1043	EUR	100	0	\N	t	2025-11-25 15:02:19.962	2025-11-25 15:02:19.962	\N
vbpb386296kv2oqyjubd6pxu	nrvc77uqaawbor31e1bx4c9a	npuhqgfcyyscj3gdsg6puu1u	SKU-npuhqgfcyyscj3gdsg6puu1u	690	EUR	100	0	\N	t	2025-11-25 15:02:20.6	2025-11-25 15:02:20.6	\N
cpm1mij0mh0m37tyjks6roqx	nrvc77uqaawbor31e1bx4c9a	ie5gum9be1tu2k7tpx9egyes	SKU-ie5gum9be1tu2k7tpx9egyes	1043	EUR	100	0	\N	t	2025-11-25 15:02:21.239	2025-11-25 15:02:21.239	\N
qmwhhlauunk3c1g7tin0zhd4	nrvc77uqaawbor31e1bx4c9a	hjpztkuij2n047nbvugibn8j	SKU-hjpztkuij2n047nbvugibn8j	1043	EUR	100	0	\N	t	2025-11-25 15:02:21.88	2025-11-25 15:02:21.88	\N
op17bzlejyq2v6v8wj74pju3	nrvc77uqaawbor31e1bx4c9a	hli4w154m85kr1rasbog69ar	SKU-hli4w154m85kr1rasbog69ar	1043	EUR	100	0	\N	t	2025-11-25 15:02:22.52	2025-11-25 15:02:22.52	\N
mmc38h4zjrk4bvufpxn2vpbo	nrvc77uqaawbor31e1bx4c9a	y4jmew85fai5qcwfdmd8v78j	SKU-y4jmew85fai5qcwfdmd8v78j	1043	EUR	100	0	\N	t	2025-11-25 15:02:23.156	2025-11-25 15:02:23.156	\N
eppdq1pmpavklzr1itgbnpy8	nrvc77uqaawbor31e1bx4c9a	bj8k0aqb9oany4kyrm59jto9	SKU-bj8k0aqb9oany4kyrm59jto9	1043	EUR	100	0	\N	t	2025-11-25 15:02:23.796	2025-11-25 15:02:23.796	\N
infihujlucwzsu2vjefy48y3	nrvc77uqaawbor31e1bx4c9a	nr88lt7nrpslgfpu327d6bby	SKU-nr88lt7nrpslgfpu327d6bby	1043	EUR	100	0	\N	t	2025-11-25 15:02:24.497	2025-11-25 15:02:24.497	\N
kxmx035uwy51kj1pfakjhhk2	nrvc77uqaawbor31e1bx4c9a	u9fzoxu4k7cf3ehpj4viqigl	SKU-u9fzoxu4k7cf3ehpj4viqigl	1043	EUR	100	0	\N	t	2025-11-25 15:02:25.135	2025-11-25 15:02:25.135	\N
xofx50bf4v813hjrx8az7z8h	nrvc77uqaawbor31e1bx4c9a	z2xh6osad7knys1n8mpoaq61	SKU-z2xh6osad7knys1n8mpoaq61	1043	EUR	100	0	\N	t	2025-11-25 15:02:25.773	2025-11-25 15:02:25.773	\N
g7n4ufm9ojpn0e8hyaow26b9	nrvc77uqaawbor31e1bx4c9a	vwht9q0oeeysku5c1f9iw0da	SKU-vwht9q0oeeysku5c1f9iw0da	818	EUR	100	0	\N	t	2025-11-25 15:02:26.425	2025-11-25 15:02:26.425	\N
ydm7bf4idaibbtr3ps5a2xzp	nrvc77uqaawbor31e1bx4c9a	fqogt2l7w0cbgwhax889xhzs	SKU-fqogt2l7w0cbgwhax889xhzs	818	EUR	100	0	\N	t	2025-11-25 15:02:27.062	2025-11-25 15:02:27.062	\N
h31k1ljhu3cc5z273bfd09xz	nrvc77uqaawbor31e1bx4c9a	bk3cq3gfh469e3zolru3lees	SKU-bk3cq3gfh469e3zolru3lees	818	EUR	100	0	\N	t	2025-11-25 15:02:27.714	2025-11-25 15:02:27.714	\N
g3xsn9kxp2v9ea7l9j5s8nuo	nrvc77uqaawbor31e1bx4c9a	qt9qtlha9edp7ifoc25j1ktt	SKU-qt9qtlha9edp7ifoc25j1ktt	818	EUR	100	0	\N	t	2025-11-25 15:02:28.347	2025-11-25 15:02:28.347	\N
fzxslwrbs937jnjx50h5jj0a	nrvc77uqaawbor31e1bx4c9a	vh8jfr5scgbgmw1z6vdfacv8	SKU-vh8jfr5scgbgmw1z6vdfacv8	818	EUR	100	0	\N	t	2025-11-25 15:02:28.987	2025-11-25 15:02:28.987	\N
juqrtjloaaipabhf77y74r52	nrvc77uqaawbor31e1bx4c9a	spfj2qmevt2g1wn2khof5vr2	SKU-spfj2qmevt2g1wn2khof5vr2	818	EUR	100	0	\N	t	2025-11-25 15:02:29.623	2025-11-25 15:02:29.623	\N
ky5dpait1bfv4rnyccx5vveo	nrvc77uqaawbor31e1bx4c9a	f2genk75trxintz0vg25pvov	SKU-f2genk75trxintz0vg25pvov	818	EUR	100	0	\N	t	2025-11-25 15:02:30.258	2025-11-25 15:02:30.258	\N
zhoy9x29d5v4597cb57s30tc	nrvc77uqaawbor31e1bx4c9a	urq3mtgrhkugxsczfz0yt6xy	SKU-urq3mtgrhkugxsczfz0yt6xy	818	EUR	100	0	\N	t	2025-11-25 15:02:30.901	2025-11-25 15:02:30.901	\N
fqtgzwxsaq407x2mqrenv9fa	nrvc77uqaawbor31e1bx4c9a	z1mdwkucge90ekj6kg0wymbf	SKU-z1mdwkucge90ekj6kg0wymbf	818	EUR	100	0	\N	t	2025-11-25 15:02:31.536	2025-11-25 15:02:31.536	\N
ackvagflh261bd7ekrum1q8g	nrvc77uqaawbor31e1bx4c9a	qmidptd3uwbis4jjo5kobtrk	SKU-qmidptd3uwbis4jjo5kobtrk	818	EUR	100	0	\N	t	2025-11-25 15:02:32.176	2025-11-25 15:02:32.176	\N
hsrf6dlkiby13ae83h3dur41	nrvc77uqaawbor31e1bx4c9a	cjpe7c0fv9nvpcczvoy9jyzz	SKU-cjpe7c0fv9nvpcczvoy9jyzz	818	EUR	100	0	\N	t	2025-11-25 15:02:32.841	2025-11-25 15:02:32.841	\N
j0oqp7stnb8jrvv70frkmt83	nrvc77uqaawbor31e1bx4c9a	dxlbrn1iv9kcfrz9o31t4bat	SKU-dxlbrn1iv9kcfrz9o31t4bat	818	EUR	100	0	\N	t	2025-11-25 15:02:33.478	2025-11-25 15:02:33.478	\N
cfxjvyeysj04vqyddri23yu7	nrvc77uqaawbor31e1bx4c9a	d66p6v4pdt6vzmwrtrf9fbrn	SKU-d66p6v4pdt6vzmwrtrf9fbrn	818	EUR	100	0	\N	t	2025-11-25 15:02:34.114	2025-11-25 15:02:34.114	\N
lid4vdmmfjlulf32cr8i5rii	nrvc77uqaawbor31e1bx4c9a	aw0w6uows9m3f453sd3ge9ve	SKU-aw0w6uows9m3f453sd3ge9ve	698	EUR	100	0	\N	t	2025-11-25 15:02:34.752	2025-11-25 15:02:34.752	\N
c657uh9pa7hjrq9956gapj96	nrvc77uqaawbor31e1bx4c9a	z8wny0oeklabtxikeielsqo9	SKU-z8wny0oeklabtxikeielsqo9	1200	EUR	100	0	\N	t	2025-11-25 15:02:35.393	2025-11-25 15:02:35.393	\N
de19y2m2go8ukvfz9oaaq8g5	nrvc77uqaawbor31e1bx4c9a	b3izgbmr3q6ijde5wjnaok8g	SKU-b3izgbmr3q6ijde5wjnaok8g	990	EUR	100	0	\N	t	2025-11-25 15:02:36.076	2025-11-25 15:02:36.076	\N
kdm69ap6ltmperm05bmdwvbb	nrvc77uqaawbor31e1bx4c9a	ccdk9gno8dl8ebg0d49y8w26	SKU-ccdk9gno8dl8ebg0d49y8w26	1553	EUR	100	0	\N	t	2025-11-25 15:02:36.71	2025-11-25 15:02:36.71	\N
lsrywrvtfg2fzun81dlux3f4	nrvc77uqaawbor31e1bx4c9a	owildn3gqeqjcdft0xmez7zw	SKU-owildn3gqeqjcdft0xmez7zw	1553	EUR	100	0	\N	t	2025-11-25 15:02:37.349	2025-11-25 15:02:37.349	\N
yr4om5nq9e2ij6blfzcn3kot	nrvc77uqaawbor31e1bx4c9a	ne07lx6gcrbncn9o07zhhr8o	SKU-ne07lx6gcrbncn9o07zhhr8o	1553	EUR	100	0	\N	t	2025-11-25 15:02:37.986	2025-11-25 15:02:37.986	\N
dfh00qejq4i1x0rp4l58xe9n	nrvc77uqaawbor31e1bx4c9a	futr5f0995wqu87r4r4aynw7	SKU-futr5f0995wqu87r4r4aynw7	1553	EUR	100	0	\N	t	2025-11-25 15:02:38.62	2025-11-25 15:02:38.62	\N
ysep0gjwf5m8bkqm75ngmhoi	nrvc77uqaawbor31e1bx4c9a	xgyrn5945v1tjpk5ntp37rkj	SKU-xgyrn5945v1tjpk5ntp37rkj	1553	EUR	100	0	\N	t	2025-11-25 15:02:39.26	2025-11-25 15:02:39.26	\N
bkzl930faytii381obuvhpmf	nrvc77uqaawbor31e1bx4c9a	k1m352m5nrdm0e9c96tt8c7b	SKU-k1m352m5nrdm0e9c96tt8c7b	990	EUR	100	0	\N	t	2025-11-25 15:02:39.971	2025-11-25 15:02:39.971	\N
zs8luob3d55cn6kburzfwgwo	nrvc77uqaawbor31e1bx4c9a	lm2h7a9ao6soqfpwwgb0k5qm	SKU-lm2h7a9ao6soqfpwwgb0k5qm	653	EUR	100	0	\N	t	2025-11-25 15:02:40.614	2025-11-25 15:02:40.614	\N
tag8l5j1y1fvdllp1qj1m7g5	nrvc77uqaawbor31e1bx4c9a	d6x8bp8uvi19kjlolvt2mqrg	SKU-d6x8bp8uvi19kjlolvt2mqrg	660	EUR	100	0	\N	t	2025-11-25 15:02:41.25	2025-11-25 15:02:41.25	\N
vke4g6khn4c9pwq488un10su	nrvc77uqaawbor31e1bx4c9a	fta78j6l0wghke79d8k9d1hd	SKU-fta78j6l0wghke79d8k9d1hd	660	EUR	100	0	\N	t	2025-11-25 15:02:41.89	2025-11-25 15:02:41.89	\N
rw4n4hjpwzn36rvo92fk2hzp	nrvc77uqaawbor31e1bx4c9a	iugkfuecg8sevmcmxh5apekd	SKU-iugkfuecg8sevmcmxh5apekd	6420	EUR	100	0	\N	t	2025-11-25 15:02:42.528	2025-11-25 15:02:42.528	\N
p6pd12gn9gx7r7hoqj0panoe	nrvc77uqaawbor31e1bx4c9a	j93n3dwv83dtaqwubmviv75n	SKU-j93n3dwv83dtaqwubmviv75n	3705	EUR	100	0	\N	t	2025-11-25 15:02:43.173	2025-11-25 15:02:43.173	\N
vxma5kgci8rhpdnyu8ajxxx5	nrvc77uqaawbor31e1bx4c9a	yskzvt7frfx7q466qbb2q649	SKU-yskzvt7frfx7q466qbb2q649	3765	EUR	100	0	\N	t	2025-11-25 15:02:43.872	2025-11-25 15:02:43.872	\N
vsvb1az0zqodck4y44efb4ls	nrvc77uqaawbor31e1bx4c9a	ys7ksg6gpjwsyryf5ilmq217	SKU-ys7ksg6gpjwsyryf5ilmq217	2550	EUR	100	0	\N	t	2025-11-25 15:02:44.513	2025-11-25 15:02:44.513	\N
aedwrgo9jsdk8ko9gnudncs2	nrvc77uqaawbor31e1bx4c9a	jw990aq4s7kuhr0383nif1y3	SKU-jw990aq4s7kuhr0383nif1y3	3720	EUR	100	0	\N	t	2025-11-25 15:02:45.149	2025-11-25 15:02:45.149	\N
ojlhowundq7q6lo2kfqtouwc	nrvc77uqaawbor31e1bx4c9a	f6vufudkc5vfo6agqte3obbi	SKU-f6vufudkc5vfo6agqte3obbi	3690	EUR	100	0	\N	t	2025-11-25 15:02:45.793	2025-11-25 15:02:45.793	\N
muqw9tp3e07h5mxxeeausr6h	nrvc77uqaawbor31e1bx4c9a	tusqj3aies160841n31gijej	SKU-tusqj3aies160841n31gijej	4575	EUR	100	0	\N	t	2025-11-25 15:02:46.43	2025-11-25 15:02:46.43	\N
ibsfjhwyddty78zwz9na3doj	nrvc77uqaawbor31e1bx4c9a	u7tanbyxoakfpxnm7wkqbikx	SKU-u7tanbyxoakfpxnm7wkqbikx	3495	EUR	100	0	\N	t	2025-11-25 15:02:47.071	2025-11-25 15:02:47.071	\N
f8en15zhc4wpde7mc6hb4y7x	nrvc77uqaawbor31e1bx4c9a	p7vzlkvh61f00rfqoy293qag	SKU-p7vzlkvh61f00rfqoy293qag	3863	EUR	100	0	\N	t	2025-11-25 15:02:47.751	2025-11-25 15:02:47.751	\N
c3mnyj4mbxi8ypnz3vycmhwt	nrvc77uqaawbor31e1bx4c9a	lvs6mxtbd61lkx0l13lat6mc	SKU-lvs6mxtbd61lkx0l13lat6mc	2363	EUR	100	0	\N	t	2025-11-25 15:02:48.402	2025-11-25 15:02:48.402	\N
c587vf3gusgqr1jet4atmcws	nrvc77uqaawbor31e1bx4c9a	el1j1pelbprrdw70fx4ibr25	SKU-el1j1pelbprrdw70fx4ibr25	4028	EUR	100	0	\N	t	2025-11-25 15:02:49.045	2025-11-25 15:02:49.045	\N
o7wr2hzesa40kfhm0h48y7ik	nrvc77uqaawbor31e1bx4c9a	f44uyfqat8zktra8dq1pjmcn	SKU-f44uyfqat8zktra8dq1pjmcn	3000	EUR	100	0	\N	t	2025-11-25 15:02:49.681	2025-11-25 15:02:49.681	\N
q2pzulgxk17co18l6tqdjehz	nrvc77uqaawbor31e1bx4c9a	s95o20o7tql5dqib6ex1ctna	SKU-s95o20o7tql5dqib6ex1ctna	4515	EUR	100	0	\N	t	2025-11-25 15:02:50.323	2025-11-25 15:02:50.323	\N
aftiuknh7vxij2i8eeletgn3	nrvc77uqaawbor31e1bx4c9a	yat1zno5dhswil52h73tt285	SKU-yat1zno5dhswil52h73tt285	1665	EUR	100	0	\N	t	2025-11-25 15:02:50.957	2025-11-25 15:02:50.957	\N
ftwig5sfkej3gwbcy2ia29o6	nrvc77uqaawbor31e1bx4c9a	l4nk517gy33umt3uwko1zlvc	SKU-l4nk517gy33umt3uwko1zlvc	2685	EUR	100	0	\N	t	2025-11-25 15:02:52.4	2025-11-25 15:02:52.4	\N
kw8oppsd2w4uki212clg8gjl	nrvc77uqaawbor31e1bx4c9a	htz8f01h7if48fvh1v2y9qxh	SKU-htz8f01h7if48fvh1v2y9qxh	4785	EUR	100	0	\N	t	2025-11-25 15:02:53.321	2025-11-25 15:02:53.321	\N
gmfr1ubov4hrv5f3i69yj5qd	nrvc77uqaawbor31e1bx4c9a	j71spk0j3mj3pccb75zzhyo9	SKU-j71spk0j3mj3pccb75zzhyo9	5925	EUR	100	0	\N	t	2025-11-25 15:02:54.056	2025-11-25 15:02:54.056	\N
bv4ri8d48i4l45itvdefa9xv	nrvc77uqaawbor31e1bx4c9a	ffyeroxumnbrqpffdv9ucmqm	SKU-ffyeroxumnbrqpffdv9ucmqm	2138	EUR	100	0	\N	t	2025-11-25 15:02:54.688	2025-11-25 15:02:54.688	\N
tl4f79kskj5ejdn49ptgazjg	nrvc77uqaawbor31e1bx4c9a	wrr4y8ss354jfvjryi9si4zp	SKU-wrr4y8ss354jfvjryi9si4zp	1110	EUR	100	0	\N	t	2025-11-25 15:02:55.318	2025-11-25 15:02:55.318	\N
wvl6yip6qqr8i6fehpm840o4	nrvc77uqaawbor31e1bx4c9a	rk4vphykba5t1w5q58ckxxqk	SKU-rk4vphykba5t1w5q58ckxxqk	1995	EUR	100	0	\N	t	2025-11-25 15:02:55.947	2025-11-25 15:02:55.947	\N
nvlile6f5mndas5qdhx43j1u	nrvc77uqaawbor31e1bx4c9a	xxtuyde9u8awzbjhix39eiwf	SKU-xxtuyde9u8awzbjhix39eiwf	2190	EUR	100	0	\N	t	2025-11-25 15:02:56.659	2025-11-25 15:02:56.659	\N
xrth6zbipk2knohrxlw6mrbk	nrvc77uqaawbor31e1bx4c9a	cwtxuiz4d6u3ko0ka036rkgj	SKU-cwtxuiz4d6u3ko0ka036rkgj	3075	EUR	100	0	\N	t	2025-11-25 15:02:57.285	2025-11-25 15:02:57.285	\N
etidhi9qo052c361xqg5pvlr	nrvc77uqaawbor31e1bx4c9a	cm3bvj6dl3nenzoxpopkui03	SKU-cm3bvj6dl3nenzoxpopkui03	1815	EUR	100	0	\N	t	2025-11-25 15:02:57.911	2025-11-25 15:02:57.911	\N
dm9i37exymq7uempucpqhg4s	nrvc77uqaawbor31e1bx4c9a	y0q8ddkerjprdk00x624vis3	SKU-y0q8ddkerjprdk00x624vis3	1988	EUR	100	0	\N	t	2025-11-25 15:02:58.545	2025-11-25 15:02:58.545	\N
ojyjvjx8v78j1hlrlmoxzqjr	nrvc77uqaawbor31e1bx4c9a	hvzbuv0ev689x5plk0fcc4ij	SKU-hvzbuv0ev689x5plk0fcc4ij	3128	EUR	100	0	\N	t	2025-11-25 15:02:59.174	2025-11-25 15:02:59.174	\N
k2cxkh3a8f1wgb8c5psz8jrw	nrvc77uqaawbor31e1bx4c9a	s8xz27425q0eiwyx5e0qa3h1	SKU-s8xz27425q0eiwyx5e0qa3h1	2123	EUR	100	0	\N	t	2025-11-25 15:02:59.81	2025-11-25 15:02:59.81	\N
pj81f15ze1b3h36i6pkoonq6	nrvc77uqaawbor31e1bx4c9a	vcw7f486tt411a881vioe5xr	SKU-vcw7f486tt411a881vioe5xr	5453	EUR	100	0	\N	t	2025-11-25 15:03:00.444	2025-11-25 15:03:00.444	\N
hlhl5bkyu4yzg21xgkkjmobq	nrvc77uqaawbor31e1bx4c9a	fius7zlcq7f5geaja025k2c7	SKU-fius7zlcq7f5geaja025k2c7	4875	EUR	100	0	\N	t	2025-11-25 15:03:01.074	2025-11-25 15:03:01.074	\N
rzf28reb8m2q4hj6nakaqub6	nrvc77uqaawbor31e1bx4c9a	lc6tthcm1kaciw1m9om331pa	SKU-lc6tthcm1kaciw1m9om331pa	4575	EUR	100	0	\N	t	2025-11-25 15:03:01.71	2025-11-25 15:03:01.71	\N
bqdblnaab6qaewfxmr31w524	nrvc77uqaawbor31e1bx4c9a	cix4wduofi7cq2k4d04oxw5e	SKU-cix4wduofi7cq2k4d04oxw5e	4425	EUR	100	0	\N	t	2025-11-25 15:03:02.339	2025-11-25 15:03:02.339	\N
orirffj27bkx6vuwv9o5ajn5	nrvc77uqaawbor31e1bx4c9a	u37uxolz4z6e2e3ri2ea306z	SKU-u37uxolz4z6e2e3ri2ea306z	1395	EUR	100	0	\N	t	2025-11-25 15:03:02.976	2025-11-25 15:03:02.976	\N
qiydsx5lsqwarheqsw7l525c	nrvc77uqaawbor31e1bx4c9a	y1chrcb76bcax655gymm9nwz	SKU-y1chrcb76bcax655gymm9nwz	1268	EUR	100	0	\N	t	2025-11-25 15:03:03.602	2025-11-25 15:03:03.602	\N
xls4mieui4ri08w4wu65ebq5	nrvc77uqaawbor31e1bx4c9a	p06xbnbgt2e5qsuhmcteanmk	SKU-p06xbnbgt2e5qsuhmcteanmk	2768	EUR	100	0	\N	t	2025-11-25 15:03:04.231	2025-11-25 15:03:04.231	\N
wcrgwr7jk3dpj6z1p91xqkjp	nrvc77uqaawbor31e1bx4c9a	zkl3nl13nlu9ohl70cye5kvh	SKU-zkl3nl13nlu9ohl70cye5kvh	878	EUR	100	0	\N	t	2025-11-25 15:03:04.863	2025-11-25 15:03:04.863	\N
ni2gb8s2pq2bxcmi4bh6tcce	nrvc77uqaawbor31e1bx4c9a	ecxijpoonmrcplvsbq6q8jiv	SKU-ecxijpoonmrcplvsbq6q8jiv	878	EUR	100	0	\N	t	2025-11-25 15:03:05.499	2025-11-25 15:03:05.499	\N
a6dcbdv5uvgns8fzx0uikudf	nrvc77uqaawbor31e1bx4c9a	exxnukliszt26d8a79mpwp49	SKU-exxnukliszt26d8a79mpwp49	593	EUR	100	0	\N	t	2025-11-25 15:03:06.13	2025-11-25 15:03:06.13	\N
tr6uj5mu0if17bh5ddef627i	nrvc77uqaawbor31e1bx4c9a	nlcbbn7fvm07fv8qaymamrfv	SKU-nlcbbn7fvm07fv8qaymamrfv	795	EUR	100	0	\N	t	2025-11-25 15:03:06.762	2025-11-25 15:03:06.762	\N
lqx4cywcfh4w8fvkmismv35u	nrvc77uqaawbor31e1bx4c9a	p04gmwqr74h9af1map4qyfu4	SKU-p04gmwqr74h9af1map4qyfu4	1478	EUR	100	0	\N	t	2025-11-25 15:03:07.462	2025-11-25 15:03:07.462	\N
nshcv134nkz2mwmk727ouqqs	nrvc77uqaawbor31e1bx4c9a	w878adciyoswiw4cjuiod6z0	SKU-w878adciyoswiw4cjuiod6z0	1005	EUR	100	0	\N	t	2025-11-25 15:03:08.098	2025-11-25 15:03:08.098	\N
k8zzd9e5biior00abj4pd1vz	nrvc77uqaawbor31e1bx4c9a	tcwrnad3tzxsvrtdk3dy18le	SKU-tcwrnad3tzxsvrtdk3dy18le	1950	EUR	100	0	\N	t	2025-11-25 15:03:08.727	2025-11-25 15:03:08.727	\N
cd296kv2n3ochgo6bxvr063q	nrvc77uqaawbor31e1bx4c9a	ryz50v3i5miqvuc1okdy3fws	SKU-ryz50v3i5miqvuc1okdy3fws	2513	EUR	100	0	\N	t	2025-11-25 15:03:09.359	2025-11-25 15:03:09.359	\N
b4ns6eb75ml4fuex4jbmnzz5	nrvc77uqaawbor31e1bx4c9a	idevo3gdpr6z6bda9k2g05pa	SKU-idevo3gdpr6z6bda9k2g05pa	2520	EUR	100	0	\N	t	2025-11-25 15:03:09.997	2025-11-25 15:03:09.997	\N
u8ezvhyij2uww8t4ttdl38ot	nrvc77uqaawbor31e1bx4c9a	o1xb5zwrawwextf0fqtsa16h	SKU-o1xb5zwrawwextf0fqtsa16h	2715	EUR	100	0	\N	t	2025-11-25 15:03:10.629	2025-11-25 15:03:10.629	\N
ymzbfeckywecis1qkqmu4ri7	nrvc77uqaawbor31e1bx4c9a	x8bo3cry197jratkzww7etbf	SKU-x8bo3cry197jratkzww7etbf	1065	EUR	100	0	\N	t	2025-11-25 15:03:11.261	2025-11-25 15:03:11.261	\N
u59egul9j9x562thou156mcs	nrvc77uqaawbor31e1bx4c9a	o159gvpppsawgwdosvivot5j	SKU-o159gvpppsawgwdosvivot5j	953	EUR	100	0	\N	t	2025-11-25 15:03:11.892	2025-11-25 15:03:11.892	\N
fsv5egzv1c608ldr4oru0fmv	nrvc77uqaawbor31e1bx4c9a	ja9utgqyv061osasiq8pdu69	SKU-ja9utgqyv061osasiq8pdu69	6263	EUR	100	0	\N	t	2025-11-25 15:03:12.551	2025-11-25 15:03:12.551	\N
nv4vv34pdakfurh8v0mz5zk5	nrvc77uqaawbor31e1bx4c9a	r05k3aa62nkoovfu2l91lm4u	SKU-r05k3aa62nkoovfu2l91lm4u	953	EUR	100	0	\N	t	2025-11-25 15:03:13.188	2025-11-25 15:03:13.188	\N
kvmfgmq919e7oxf2jalte0t6	nrvc77uqaawbor31e1bx4c9a	llhm329z4yg0nldt8b4z6rwb	SKU-llhm329z4yg0nldt8b4z6rwb	2040	EUR	100	0	\N	t	2025-11-25 15:03:13.819	2025-11-25 15:03:13.819	\N
fh28x9fbfipp7a1o5zvhhamp	nrvc77uqaawbor31e1bx4c9a	lijwrm0mfay1fy2hlcc7iod6	SKU-lijwrm0mfay1fy2hlcc7iod6	1628	EUR	100	0	\N	t	2025-11-25 15:03:14.45	2025-11-25 15:03:14.45	\N
kwcbbrzca42xxxy0qnruepvf	nrvc77uqaawbor31e1bx4c9a	fbl94a5moeomnpvax31pu8s2	SKU-fbl94a5moeomnpvax31pu8s2	1793	EUR	100	0	\N	t	2025-11-25 15:03:15.089	2025-11-25 15:03:15.089	\N
vpkyv26z2vb9yjkfrq7ts3vn	nrvc77uqaawbor31e1bx4c9a	rnen8r1i0k9tcmflmtnakkkd	SKU-rnen8r1i0k9tcmflmtnakkkd	2220	EUR	100	0	\N	t	2025-11-25 15:03:15.717	2025-11-25 15:03:15.717	\N
xm2iwy2lztlrjvam9p75krky	nrvc77uqaawbor31e1bx4c9a	t5yv24rfe49igmywkvt028v7	SKU-t5yv24rfe49igmywkvt028v7	2220	EUR	100	0	\N	t	2025-11-25 15:03:16.354	2025-11-25 15:03:16.354	\N
yscyqu8i476tjy5wxjeubysy	nrvc77uqaawbor31e1bx4c9a	e1423pterzx9ndsdwxa1l93k	SKU-e1423pterzx9ndsdwxa1l93k	863	EUR	100	0	\N	t	2025-11-25 15:03:16.982	2025-11-25 15:03:16.982	\N
n1sayfkkmpnbwb56k0g11395	nrvc77uqaawbor31e1bx4c9a	builyz7gsj86cflviqy5z5to	SKU-builyz7gsj86cflviqy5z5to	990	EUR	100	0	\N	t	2025-11-25 15:03:17.611	2025-11-25 15:03:17.611	\N
fewbhomm8ddmlu3zddcgxeq4	nrvc77uqaawbor31e1bx4c9a	xijoixkgwlb9n3i9f9y93e2w	SKU-xijoixkgwlb9n3i9f9y93e2w	1350	EUR	100	0	\N	t	2025-11-25 15:03:18.244	2025-11-25 15:03:18.244	\N
rr43yf35u0ihjul4s82alg85	nrvc77uqaawbor31e1bx4c9a	ei7gg8c7yrnmdqv8lhcp8gd8	SKU-ei7gg8c7yrnmdqv8lhcp8gd8	1290	EUR	100	0	\N	t	2025-11-25 15:03:18.872	2025-11-25 15:03:18.872	\N
x9fekxijsnivl0wm3eveeo7h	nrvc77uqaawbor31e1bx4c9a	n744ajknrcorlxgepnf6nboq	SKU-n744ajknrcorlxgepnf6nboq	705	EUR	100	0	\N	t	2025-11-25 15:03:19.504	2025-11-25 15:03:19.504	\N
wx8snef9d8rck7yjg8yva0mz	nrvc77uqaawbor31e1bx4c9a	osmapves747azvvshrlg1fq8	SKU-osmapves747azvvshrlg1fq8	1500	EUR	100	0	\N	t	2025-11-25 15:03:20.14	2025-11-25 15:03:20.14	\N
m279urvxd9xbf577s6nsd10h	nrvc77uqaawbor31e1bx4c9a	ml22z9wykpt3yo1rl0uk5q13	SKU-ml22z9wykpt3yo1rl0uk5q13	3675	EUR	100	0	\N	t	2025-11-25 15:03:21.074	2025-11-25 15:03:21.074	\N
ugd373k81f0olj1ugcsig1sd	nrvc77uqaawbor31e1bx4c9a	qtogzugrdgonwsi0ciijh79r	SKU-qtogzugrdgonwsi0ciijh79r	8400	EUR	100	0	\N	t	2025-11-25 15:03:21.923	2025-11-25 15:03:21.923	\N
bwxni78pb2irme3bsjhqg8kl	nrvc77uqaawbor31e1bx4c9a	ignr0jqs0h07mdcn42hgm4ev	SKU-ignr0jqs0h07mdcn42hgm4ev	3353	EUR	100	0	\N	t	2025-11-25 15:03:22.689	2025-11-25 15:03:22.689	\N
osspzpsdwobgctmcotwei466	nrvc77uqaawbor31e1bx4c9a	c9cejc0on48qysnaa36yo6ne	SKU-c9cejc0on48qysnaa36yo6ne	5273	EUR	100	0	\N	t	2025-11-25 15:03:23.329	2025-11-25 15:03:23.329	\N
orijvk26j6dyye2m5wwd79ut	nrvc77uqaawbor31e1bx4c9a	jo37g01j527vdvcr2nheivq0	SKU-jo37g01j527vdvcr2nheivq0	1845	EUR	100	0	\N	t	2025-11-25 15:03:24.492	2025-11-25 15:03:24.492	\N
ckla5qiq77f4do5i62o1vlkw	nrvc77uqaawbor31e1bx4c9a	xorlpgth7c6b6l7iisy7hkxs	SKU-xorlpgth7c6b6l7iisy7hkxs	4073	EUR	100	0	\N	t	2025-11-25 15:03:25.341	2025-11-25 15:03:25.341	\N
bs2g9b3sqlzdffchdyl1qi1c	nrvc77uqaawbor31e1bx4c9a	fw8yq6lws9rlq61n5m373qsv	SKU-fw8yq6lws9rlq61n5m373qsv	2175	EUR	100	0	\N	t	2025-11-25 15:03:26.246	2025-11-25 15:03:26.246	\N
xptw46uca8t9gs8ciboe3nf1	nrvc77uqaawbor31e1bx4c9a	hpwxgwfuq3rkydpkdb5jcqzt	SKU-hpwxgwfuq3rkydpkdb5jcqzt	3900	EUR	100	0	\N	t	2025-11-25 15:03:27.218	2025-11-25 15:03:27.218	\N
gvuxjfu5ljv4537dmas9he38	nrvc77uqaawbor31e1bx4c9a	akidrlwb7elno5kye54tkgb6	SKU-akidrlwb7elno5kye54tkgb6	1875	EUR	100	0	\N	t	2025-11-25 15:03:29.163	2025-11-25 15:03:29.163	\N
qa1doxznpssosqksk5zo226c	nrvc77uqaawbor31e1bx4c9a	qnw56zl57fbz0y3x0x4irv76	SKU-qnw56zl57fbz0y3x0x4irv76	3000	EUR	100	0	\N	t	2025-11-25 15:03:30.211	2025-11-25 15:03:30.211	\N
cdnbius0bpsg9z0ccudbbs1l	nrvc77uqaawbor31e1bx4c9a	az1g8y2t4nb3yonxjpprq5qe	SKU-az1g8y2t4nb3yonxjpprq5qe	3300	EUR	100	0	\N	t	2025-11-25 15:03:31.045	2025-11-25 15:03:31.045	\N
oe7crszy86q0wznsnju10zra	nrvc77uqaawbor31e1bx4c9a	sfqvs67kc8n2ec7vo673v6i0	SKU-sfqvs67kc8n2ec7vo673v6i0	1590	EUR	100	0	\N	t	2025-11-25 15:03:32.073	2025-11-25 15:03:32.073	\N
dwmqnvoues59ua8vlmqe8bh5	nrvc77uqaawbor31e1bx4c9a	bfvifw4ihwxinp8n5dt0jzdi	SKU-bfvifw4ihwxinp8n5dt0jzdi	1425	EUR	100	0	\N	t	2025-11-25 15:03:33.127	2025-11-25 15:03:33.127	\N
vvpo687ai5eucbhvl00a6hwx	nrvc77uqaawbor31e1bx4c9a	s0mkthiq6fr6kk48jcjmys5h	SKU-s0mkthiq6fr6kk48jcjmys5h	5078	EUR	100	0	\N	t	2025-11-25 15:03:34.058	2025-11-25 15:03:34.058	\N
lthibotgsankqn3ai5v8zg5s	nrvc77uqaawbor31e1bx4c9a	g0pq8ktm0ygc2vfxirwu748n	SKU-g0pq8ktm0ygc2vfxirwu748n	3375	EUR	100	0	\N	t	2025-11-25 15:03:35.357	2025-11-25 15:03:35.357	\N
gv89oygmqukq55fao1l5pas2	nrvc77uqaawbor31e1bx4c9a	cd2d0bitivrpr9r8otjla6eh	SKU-cd2d0bitivrpr9r8otjla6eh	5363	EUR	100	0	\N	t	2025-11-25 15:03:36.182	2025-11-25 15:03:36.182	\N
ovajw43e2dvsz88fxaidcg2n	nrvc77uqaawbor31e1bx4c9a	ubsdpq457gqgg51vklsmt6a7	SKU-ubsdpq457gqgg51vklsmt6a7	3600	EUR	100	0	\N	t	2025-11-25 15:03:37.023	2025-11-25 15:03:37.023	\N
q0fqo095e4j7sg4ptwndzupm	nrvc77uqaawbor31e1bx4c9a	kjhxtf4kbqjm5eqhl5umczjc	SKU-kjhxtf4kbqjm5eqhl5umczjc	1140	EUR	100	0	\N	t	2025-11-25 15:03:39.14	2025-11-25 15:03:39.14	\N
oxc75y9wr5h54g81zozzesyv	nrvc77uqaawbor31e1bx4c9a	v81pcnloegwjn4hbkw3o6bxz	SKU-v81pcnloegwjn4hbkw3o6bxz	5250	EUR	100	0	\N	t	2025-11-25 15:03:40.537	2025-11-25 15:03:40.537	\N
cg9j7ew6w7kpgzxm7x84nyqb	nrvc77uqaawbor31e1bx4c9a	x9kkgzq727s5pbq64rrokvh5	SKU-x9kkgzq727s5pbq64rrokvh5	1350	EUR	100	0	\N	t	2025-11-25 15:03:41.371	2025-11-25 15:03:41.371	\N
sht9zv9385nf3w9exrmk5j11	nrvc77uqaawbor31e1bx4c9a	sj5a6om92mfu7ikuowilfoy8	SKU-sj5a6om92mfu7ikuowilfoy8	2325	EUR	100	0	\N	t	2025-11-25 15:03:42.196	2025-11-25 15:03:42.196	\N
ulizhj5d8h7vztjcvevujhls	nrvc77uqaawbor31e1bx4c9a	hvkmkxb8ygql1007hrynjo7e	SKU-hvkmkxb8ygql1007hrynjo7e	3030	EUR	100	0	\N	t	2025-11-25 15:03:44.053	2025-11-25 15:03:44.053	\N
o2upzeasw54may2rljak1ia8	nrvc77uqaawbor31e1bx4c9a	el0f2krhiyq1qdqwa3x6vy0c	SKU-el0f2krhiyq1qdqwa3x6vy0c	4440	EUR	100	0	\N	t	2025-11-25 15:03:45.988	2025-11-25 15:03:45.988	\N
myujdtnjz286yu1rtkhpfoav	nrvc77uqaawbor31e1bx4c9a	iup4zek3w3djgsvybpzrvvgi	SKU-iup4zek3w3djgsvybpzrvvgi	1628	EUR	100	0	\N	t	2025-11-25 15:03:46.632	2025-11-25 15:03:46.632	\N
kg6dom3akuwjxywadgwrc4ii	nrvc77uqaawbor31e1bx4c9a	n9338vlwu4nllyxmthm8z8ur	SKU-n9338vlwu4nllyxmthm8z8ur	2070	EUR	100	0	\N	t	2025-11-25 15:03:47.264	2025-11-25 15:03:47.264	\N
g2prqkk0jchn3o3xzhx3kz0u	nrvc77uqaawbor31e1bx4c9a	qqcsa4mzcyxpiuew2t9rwr4g	SKU-qqcsa4mzcyxpiuew2t9rwr4g	1665	EUR	100	0	\N	t	2025-11-25 15:03:47.894	2025-11-25 15:03:47.894	\N
rlff5fhlw94wq98p3ijyvazd	nrvc77uqaawbor31e1bx4c9a	o9w0yd1wyjf5k8vtktlb8gzk	SKU-o9w0yd1wyjf5k8vtktlb8gzk	4440	EUR	100	0	\N	t	2025-11-25 15:03:48.53	2025-11-25 15:03:48.53	\N
g7y2gye9o0el8t3ix8avysox	nrvc77uqaawbor31e1bx4c9a	kas406kwdjyh0r4rimov8rw2	SKU-kas406kwdjyh0r4rimov8rw2	3420	EUR	100	0	\N	t	2025-11-25 15:03:49.158	2025-11-25 15:03:49.158	\N
c9focz8qe1jnayhbxa7vca4b	nrvc77uqaawbor31e1bx4c9a	uo5vbvsur7mlpqptwdxy3amr	SKU-uo5vbvsur7mlpqptwdxy3amr	3488	EUR	100	0	\N	t	2025-11-25 15:03:49.788	2025-11-25 15:03:49.788	\N
c3ps8dsvuo2c0o6dq3pcs4wp	nrvc77uqaawbor31e1bx4c9a	e5rjyyby4o0swb7zdhckadnf	SKU-e5rjyyby4o0swb7zdhckadnf	3960	EUR	100	0	\N	t	2025-11-25 15:03:50.422	2025-11-25 15:03:50.422	\N
on74makkogf5vvl860l607e6	nrvc77uqaawbor31e1bx4c9a	aisujm4w20zs2kutj5do9287	SKU-aisujm4w20zs2kutj5do9287	1965	EUR	100	0	\N	t	2025-11-25 15:03:51.056	2025-11-25 15:03:51.056	\N
br1oqta0ygv0wo2uim1mhfgh	nrvc77uqaawbor31e1bx4c9a	hdvo83wzq1eqeyriksaqcip5	SKU-hdvo83wzq1eqeyriksaqcip5	1860	EUR	100	0	\N	t	2025-11-25 15:03:51.689	2025-11-25 15:03:51.689	\N
q55r2koduj2vwku6lj32vqrn	nrvc77uqaawbor31e1bx4c9a	ao5dm5zfe6vl62ejnvy116fz	SKU-ao5dm5zfe6vl62ejnvy116fz	2700	EUR	100	0	\N	t	2025-11-25 15:03:52.322	2025-11-25 15:03:52.322	\N
wnabdt9z7yq8w3zqbna7doc3	nrvc77uqaawbor31e1bx4c9a	cgvaz3tka5pio9rza9kkow8l	SKU-cgvaz3tka5pio9rza9kkow8l	1950	EUR	100	0	\N	t	2025-11-25 15:03:52.957	2025-11-25 15:03:52.957	\N
nep7v4idmwspm6bykrlsr444	nrvc77uqaawbor31e1bx4c9a	io569p7yur7mmn0vq59n2a78	SKU-io569p7yur7mmn0vq59n2a78	2400	EUR	100	0	\N	t	2025-11-25 15:03:53.655	2025-11-25 15:03:53.655	\N
f1bdd3tqxe0fw5thg2y2rifl	nrvc77uqaawbor31e1bx4c9a	nf35j38dtux9o40rqdmp6mtz	SKU-nf35j38dtux9o40rqdmp6mtz	2400	EUR	100	0	\N	t	2025-11-25 15:03:54.284	2025-11-25 15:03:54.284	\N
q3kj7sc1nlu4p946rcz496bv	nrvc77uqaawbor31e1bx4c9a	d3hfr467acvonw4h617rze84	SKU-d3hfr467acvonw4h617rze84	2400	EUR	100	0	\N	t	2025-11-25 15:03:54.915	2025-11-25 15:03:54.915	\N
muu1p45wvy3d2t1xakpisnt5	nrvc77uqaawbor31e1bx4c9a	camqzdt3za9oie8hs3ebynhs	SKU-camqzdt3za9oie8hs3ebynhs	2400	EUR	100	0	\N	t	2025-11-25 15:03:55.564	2025-11-25 15:03:55.564	\N
qexzlrtcgi8tob48lbfgcts1	nrvc77uqaawbor31e1bx4c9a	jnzrqtihp2g2q5q910ppvef6	SKU-jnzrqtihp2g2q5q910ppvef6	2475	EUR	100	0	\N	t	2025-11-25 15:03:56.195	2025-11-25 15:03:56.195	\N
ozu1muje2ca5g6ttwk9lc75z	nrvc77uqaawbor31e1bx4c9a	sl06uri1muspb89cju3h16aq	SKU-sl06uri1muspb89cju3h16aq	2610	EUR	100	0	\N	t	2025-11-25 15:03:56.831	2025-11-25 15:03:56.831	\N
r0ao6n03tf57zk4kp317jv1d	nrvc77uqaawbor31e1bx4c9a	ve44j9beoy53wrnpz4whargc	SKU-ve44j9beoy53wrnpz4whargc	1800	EUR	100	0	\N	t	2025-11-25 15:03:57.462	2025-11-25 15:03:57.462	\N
fc6ohpa0ofslz4fr0o1awu6l	nrvc77uqaawbor31e1bx4c9a	cid1u7jicdf5hqrru63x6zwv	SKU-cid1u7jicdf5hqrru63x6zwv	1973	EUR	100	0	\N	t	2025-11-25 15:03:58.094	2025-11-25 15:03:58.094	\N
fynxnao6hwpdsc5p0jfmx67i	nrvc77uqaawbor31e1bx4c9a	ecahrkmntbfgw0ylk4cl7h5d	SKU-ecahrkmntbfgw0ylk4cl7h5d	3518	EUR	100	0	\N	t	2025-11-25 15:03:58.722	2025-11-25 15:03:58.722	\N
in4kh0d8l8rrp8fhk86nzqk7	nrvc77uqaawbor31e1bx4c9a	tx954kxkwy4po6o2nc2z5rp5	SKU-tx954kxkwy4po6o2nc2z5rp5	8310	EUR	100	0	\N	t	2025-11-25 15:03:59.355	2025-11-25 15:03:59.355	\N
b6361w6oz19rh7wh1r8qhszb	nrvc77uqaawbor31e1bx4c9a	e1bnddxi0gtzbib5pe4wwvxl	SKU-e1bnddxi0gtzbib5pe4wwvxl	4163	EUR	100	0	\N	t	2025-11-25 15:03:59.985	2025-11-25 15:03:59.985	\N
j9k5eo0s0oraa2vpblbg9sut	nrvc77uqaawbor31e1bx4c9a	wz6nkw1hi1n5h4edxcwhn2pd	SKU-wz6nkw1hi1n5h4edxcwhn2pd	3495	EUR	100	0	\N	t	2025-11-25 15:04:00.613	2025-11-25 15:04:00.613	\N
skt1fcrt9vlmmlld3xvh4597	nrvc77uqaawbor31e1bx4c9a	yrljuntd3b635nhn48022a90	SKU-yrljuntd3b635nhn48022a90	2925	EUR	100	0	\N	t	2025-11-25 15:04:01.249	2025-11-25 15:04:01.249	\N
yptp0d65xcj59p2wqm26cbej	nrvc77uqaawbor31e1bx4c9a	cb1phu7k6chw9t7mu1wsh3ui	SKU-cb1phu7k6chw9t7mu1wsh3ui	1703	EUR	100	0	\N	t	2025-11-25 15:04:01.876	2025-11-25 15:04:01.876	\N
kjc2nhc24iwu580wsyw6t760	nrvc77uqaawbor31e1bx4c9a	udramdm4oxcjedfngaybzmsf	SKU-udramdm4oxcjedfngaybzmsf	3150	EUR	100	0	\N	t	2025-11-25 15:04:02.509	2025-11-25 15:04:02.509	\N
d0q8kg52hofo6pipxjc3lzva	nrvc77uqaawbor31e1bx4c9a	bz2w7pwx2khzvg3ixugbcvz3	SKU-bz2w7pwx2khzvg3ixugbcvz3	3825	EUR	100	0	\N	t	2025-11-25 15:04:03.137	2025-11-25 15:04:03.137	\N
angkztvfwkc21sn46jal4h4i	nrvc77uqaawbor31e1bx4c9a	ma0gamn9iltarsi1fdrsjfg8	SKU-ma0gamn9iltarsi1fdrsjfg8	5700	EUR	100	0	\N	t	2025-11-25 15:04:03.769	2025-11-25 15:04:03.769	\N
p3nfl6jcrahd4fp8anckguzd	nrvc77uqaawbor31e1bx4c9a	akh7exf28mvkaiq6q3djaibk	SKU-akh7exf28mvkaiq6q3djaibk	6773	EUR	100	0	\N	t	2025-11-25 15:04:04.414	2025-11-25 15:04:04.414	\N
p0w0yuklcmdsklj4e9hopjbf	nrvc77uqaawbor31e1bx4c9a	mi61ksitp22nesm7o0eh00g7	SKU-mi61ksitp22nesm7o0eh00g7	945	EUR	100	0	\N	t	2025-11-25 15:04:05.063	2025-11-25 15:04:05.063	\N
ty4rp89gxw9zvo2ddlv95i81	nrvc77uqaawbor31e1bx4c9a	gendb7rykh0us3zq7ik8jezd	SKU-gendb7rykh0us3zq7ik8jezd	2700	EUR	100	0	\N	t	2025-11-25 15:04:05.701	2025-11-25 15:04:05.701	\N
scdwmr8l3irs87nnlchj0mz8	nrvc77uqaawbor31e1bx4c9a	fomd6em2zyztena80teoua58	SKU-fomd6em2zyztena80teoua58	504	EUR	100	0	\N	t	2025-11-25 15:09:18.805	2025-11-25 15:09:18.805	\N
n1m9m6yg4etw8l8yiartebsb	nrvc77uqaawbor31e1bx4c9a	br3emwe6j1vwdez94byvnufi	SKU-br3emwe6j1vwdez94byvnufi	782	EUR	100	0	\N	t	2025-11-25 15:09:19.456	2025-11-25 15:09:19.456	\N
yp7ym50t9xb2f7ti91j31bpq	nrvc77uqaawbor31e1bx4c9a	g9nlfj1few540401rrtk64hy	SKU-g9nlfj1few540401rrtk64hy	782	EUR	100	0	\N	t	2025-11-25 15:09:20.094	2025-11-25 15:09:20.094	\N
bye0fo0jrdb618dka7m2kypi	nrvc77uqaawbor31e1bx4c9a	tko01dp5620b0ppbittjloov	SKU-tko01dp5620b0ppbittjloov	782	EUR	100	0	\N	t	2025-11-25 15:09:20.733	2025-11-25 15:09:20.733	\N
dzji9sayx3qhigxzhzn38lnc	nrvc77uqaawbor31e1bx4c9a	gruemfxom5blfd9rhfouy79r	SKU-gruemfxom5blfd9rhfouy79r	782	EUR	100	0	\N	t	2025-11-25 15:09:21.37	2025-11-25 15:09:21.37	\N
b2xoxfvmk3zxor9lpoofro3c	nrvc77uqaawbor31e1bx4c9a	e7zfsafo4dlw2qnao6rryk40	SKU-e7zfsafo4dlw2qnao6rryk40	782	EUR	100	0	\N	t	2025-11-25 15:09:22.017	2025-11-25 15:09:22.017	\N
xhgax6c98adzqkic599lvoek	nrvc77uqaawbor31e1bx4c9a	e7rbyg7lqh11ltzt268ih2u3	SKU-e7rbyg7lqh11ltzt268ih2u3	782	EUR	100	0	\N	t	2025-11-25 15:09:22.657	2025-11-25 15:09:22.657	\N
j6slvczwbi8uz5k45f4r9i5e	nrvc77uqaawbor31e1bx4c9a	cmimxu1spnw6wszkzu1x1eun	SKU-cmimxu1spnw6wszkzu1x1eun	782	EUR	100	0	\N	t	2025-11-25 15:09:23.293	2025-11-25 15:09:23.293	\N
tijeyx0hau52hhslz5n50mmy	nrvc77uqaawbor31e1bx4c9a	g29rdz97w4ghgoymr0fptadn	SKU-g29rdz97w4ghgoymr0fptadn	987	EUR	100	0	\N	t	2025-11-25 15:09:23.999	2025-11-25 15:09:23.999	\N
v1gnc91li57rxufb4w39m1ma	nrvc77uqaawbor31e1bx4c9a	mannprc6ozmk4xifvzpncowf	SKU-mannprc6ozmk4xifvzpncowf	829	EUR	100	0	\N	t	2025-11-25 15:09:24.636	2025-11-25 15:09:24.636	\N
tg3kvmt9y4ell3fu52bybbqv	nrvc77uqaawbor31e1bx4c9a	au10wfmfi8ohs5vdnk7szzmk	SKU-au10wfmfi8ohs5vdnk7szzmk	1139	EUR	100	0	\N	t	2025-11-25 15:09:25.269	2025-11-25 15:09:25.269	\N
zhj4ult24600av868ts241p0	nrvc77uqaawbor31e1bx4c9a	fnyfvz9xrktjfrthrdf1x2j3	SKU-fnyfvz9xrktjfrthrdf1x2j3	968	EUR	100	0	\N	t	2025-11-25 15:09:25.904	2025-11-25 15:09:25.904	\N
yxonevw9ucixpm9he17f7mjz	nrvc77uqaawbor31e1bx4c9a	bueewxomfegud8djp48eqqnf	SKU-bueewxomfegud8djp48eqqnf	1763	EUR	100	0	\N	t	2025-11-25 15:04:06.337	2025-11-25 15:04:06.337	\N
bd7y8l2fubuupsij8m0kk3iv	nrvc77uqaawbor31e1bx4c9a	fqvxai7atxlgzsq2cvz5gvwd	SKU-fqvxai7atxlgzsq2cvz5gvwd	3750	EUR	100	0	\N	t	2025-11-25 15:04:06.966	2025-11-25 15:04:06.966	\N
nqr9zq5z9mv0f6890lu13d2z	nrvc77uqaawbor31e1bx4c9a	w4xcbbrp7wn4kj4x9w6brslo	SKU-w4xcbbrp7wn4kj4x9w6brslo	4260	EUR	100	0	\N	t	2025-11-25 15:04:07.595	2025-11-25 15:04:07.595	\N
b8ycqb6okhbimhdub23pixbv	nrvc77uqaawbor31e1bx4c9a	rfar93qapdhwwblelvv7oh64	SKU-rfar93qapdhwwblelvv7oh64	4200	EUR	100	0	\N	t	2025-11-25 15:04:08.235	2025-11-25 15:04:08.235	\N
wxjoaucvo06ee6ywtrcuffz5	nrvc77uqaawbor31e1bx4c9a	uslndo5y6pmo7qgdwf211wrl	SKU-uslndo5y6pmo7qgdwf211wrl	6450	EUR	100	0	\N	t	2025-11-25 15:04:08.934	2025-11-25 15:04:08.934	\N
etnpeoxqdntj9cot1n0rdtz3	nrvc77uqaawbor31e1bx4c9a	iw74acpf0zre3au7i7c1anyg	SKU-iw74acpf0zre3au7i7c1anyg	1778	EUR	100	0	\N	t	2025-11-25 15:04:09.563	2025-11-25 15:04:09.563	\N
fqwopq3a9dziugejw6mveksb	nrvc77uqaawbor31e1bx4c9a	wgfil1tfr3vomt7eivl87t9i	SKU-wgfil1tfr3vomt7eivl87t9i	2138	EUR	100	0	\N	t	2025-11-25 15:04:10.2	2025-11-25 15:04:10.2	\N
jddzsqpg7eazxkz79zta9ljn	nrvc77uqaawbor31e1bx4c9a	dj59tcnrggmmk8ebzs3wy5io	SKU-dj59tcnrggmmk8ebzs3wy5io	2138	EUR	100	0	\N	t	2025-11-25 15:04:10.834	2025-11-25 15:04:10.834	\N
i9opejgpdnpenqftnvxrirzu	nrvc77uqaawbor31e1bx4c9a	ffhf1ls452k5w6mxvpwalo5f	SKU-ffhf1ls452k5w6mxvpwalo5f	3585	EUR	100	0	\N	t	2025-11-25 15:04:11.479	2025-11-25 15:04:11.479	\N
zm0sing6rzaudlc6fkrlzwmb	nrvc77uqaawbor31e1bx4c9a	al2xntwdbknkcp5bi2lj7zxe	SKU-al2xntwdbknkcp5bi2lj7zxe	1710	EUR	100	0	\N	t	2025-11-25 15:04:12.114	2025-11-25 15:04:12.114	\N
r270q4boovsupgs5lcwfy2wq	nrvc77uqaawbor31e1bx4c9a	utm20rivdpahwcukl7nq2arw	SKU-utm20rivdpahwcukl7nq2arw	1455	EUR	100	0	\N	t	2025-11-25 15:04:12.746	2025-11-25 15:04:12.746	\N
yenkn9hrsti7f18z32ak14xm	nrvc77uqaawbor31e1bx4c9a	azyw4rvb7wa1avxka7o9ttje	SKU-azyw4rvb7wa1avxka7o9ttje	3690	EUR	100	0	\N	t	2025-11-25 15:04:13.392	2025-11-25 15:04:13.392	\N
y702me9ghxuzefzaeadg02tb	nrvc77uqaawbor31e1bx4c9a	ym7n95cbmqy3r4sxtca338la	SKU-ym7n95cbmqy3r4sxtca338la	2745	EUR	100	0	\N	t	2025-11-25 15:04:14.046	2025-11-25 15:04:14.046	\N
ptge5fesfgb5pg8gx19ef72e	nrvc77uqaawbor31e1bx4c9a	fmwn84dfeti38b3q8r0kln57	SKU-fmwn84dfeti38b3q8r0kln57	2018	EUR	100	0	\N	t	2025-11-25 15:04:14.686	2025-11-25 15:04:14.686	\N
jil8gaj5lnsz4wnfw0j0jpad	nrvc77uqaawbor31e1bx4c9a	jkzxq98suf0th63wt2epoxvt	SKU-jkzxq98suf0th63wt2epoxvt	5400	EUR	100	0	\N	t	2025-11-25 15:04:15.316	2025-11-25 15:04:15.316	\N
a2nn8i5byyxykw3dxpehutbi	nrvc77uqaawbor31e1bx4c9a	tk0ayn5edjxc9lkdbcwyzzcy	SKU-tk0ayn5edjxc9lkdbcwyzzcy	2970	EUR	100	0	\N	t	2025-11-25 15:04:15.947	2025-11-25 15:04:15.947	\N
jrcb0pm5v7ihullo2s5rkwww	nrvc77uqaawbor31e1bx4c9a	aja0jzl7em89n0u0rj1fwez9	SKU-aja0jzl7em89n0u0rj1fwez9	3398	EUR	100	0	\N	t	2025-11-25 15:04:16.576	2025-11-25 15:04:16.576	\N
ril2mblolsrz9dci31mbsdog	nrvc77uqaawbor31e1bx4c9a	bq44fu87v9c1gcmthpbkplra	SKU-bq44fu87v9c1gcmthpbkplra	1890	EUR	100	0	\N	t	2025-11-25 15:04:17.209	2025-11-25 15:04:17.209	\N
befrs88jmjgoqpyhzf5rgw6n	nrvc77uqaawbor31e1bx4c9a	ulyl70w0fi6q511t8ldynqy2	SKU-ulyl70w0fi6q511t8ldynqy2	1358	EUR	100	0	\N	t	2025-11-25 15:04:17.84	2025-11-25 15:04:17.84	\N
qs2edzd3tp75cfc9ieeqvrn7	nrvc77uqaawbor31e1bx4c9a	usac7nc1qe2erdveze1hsm1e	SKU-usac7nc1qe2erdveze1hsm1e	1335	EUR	100	0	\N	t	2025-11-25 15:04:18.474	2025-11-25 15:04:18.474	\N
zb37oum8vu9jfagwv8nivvz5	nrvc77uqaawbor31e1bx4c9a	fdlrh6mwbc35g01dydcek2rs	SKU-fdlrh6mwbc35g01dydcek2rs	2160	EUR	100	0	\N	t	2025-11-25 15:04:19.104	2025-11-25 15:04:19.104	\N
r9h53l55tedaqr1qxsjv7skn	nrvc77uqaawbor31e1bx4c9a	t7n29fno00dswx9ao3zkiqhu	SKU-t7n29fno00dswx9ao3zkiqhu	2325	EUR	100	0	\N	t	2025-11-25 15:04:19.787	2025-11-25 15:04:19.787	\N
te01ifkvwavkojqh0l7r9b2d	nrvc77uqaawbor31e1bx4c9a	b0t6ky8eprl2ogoes9b5rn9t	SKU-b0t6ky8eprl2ogoes9b5rn9t	1050	EUR	100	0	\N	t	2025-11-25 15:04:20.419	2025-11-25 15:04:20.419	\N
u9vptg6we3ksa6rv3upmb7wp	nrvc77uqaawbor31e1bx4c9a	k0fkfunmhekwm17w3vezglg6	SKU-k0fkfunmhekwm17w3vezglg6	1800	EUR	100	0	\N	t	2025-11-25 15:04:21.046	2025-11-25 15:04:21.046	\N
d6gd8vxrfz3hzuwc5919dj6r	nrvc77uqaawbor31e1bx4c9a	o5onom810ro1cpvtfav093ft	SKU-o5onom810ro1cpvtfav093ft	1290	EUR	100	0	\N	t	2025-11-25 15:04:21.677	2025-11-25 15:04:21.677	\N
sbdyy8csk2w99ftfwxhiksk7	nrvc77uqaawbor31e1bx4c9a	o6q353if3pp29t5v2bdgdy2y	SKU-o6q353if3pp29t5v2bdgdy2y	1875	EUR	100	0	\N	t	2025-11-25 15:04:22.31	2025-11-25 15:04:22.31	\N
muznodqty3vmyyqbd27dzt5j	nrvc77uqaawbor31e1bx4c9a	gb548r4qr9qra7krhl8059pt	SKU-gb548r4qr9qra7krhl8059pt	1875	EUR	100	0	\N	t	2025-11-25 15:04:22.938	2025-11-25 15:04:22.938	\N
th92dlgtuq5dp7uhuezfsku5	nrvc77uqaawbor31e1bx4c9a	y1cb6hvbxegmwq8rl9kz0m1h	SKU-y1cb6hvbxegmwq8rl9kz0m1h	1875	EUR	100	0	\N	t	2025-11-25 15:04:23.571	2025-11-25 15:04:23.571	\N
hgju9sl2ftzpqe87epu4fmmy	nrvc77uqaawbor31e1bx4c9a	nybjiopqamewb5b6bnvpis61	SKU-nybjiopqamewb5b6bnvpis61	1875	EUR	100	0	\N	t	2025-11-25 15:04:24.27	2025-11-25 15:04:24.27	\N
n2wvtrkz4gkk3o1vpq8pblri	nrvc77uqaawbor31e1bx4c9a	uywoi3xnzpg32xata21r1ptr	SKU-uywoi3xnzpg32xata21r1ptr	1875	EUR	100	0	\N	t	2025-11-25 15:04:24.937	2025-11-25 15:04:24.937	\N
eomzbeqo0v2hvjcxw73jjtcg	nrvc77uqaawbor31e1bx4c9a	bci9iu8gsaa1izqgpmse2v4i	SKU-bci9iu8gsaa1izqgpmse2v4i	1875	EUR	100	0	\N	t	2025-11-25 15:04:25.575	2025-11-25 15:04:25.575	\N
ncclb6zgjik87s7w8ynkdkeo	nrvc77uqaawbor31e1bx4c9a	q1suo4clgnuxrgdjyyk011kl	SKU-q1suo4clgnuxrgdjyyk011kl	2700	EUR	100	0	\N	t	2025-11-25 15:04:26.214	2025-11-25 15:04:26.214	\N
lshq2i1ushqdk8unyfejyw28	nrvc77uqaawbor31e1bx4c9a	ih3t00vxxqjmr3vfljpx6gzk	SKU-ih3t00vxxqjmr3vfljpx6gzk	1980	EUR	100	0	\N	t	2025-11-25 15:04:26.842	2025-11-25 15:04:26.842	\N
dd0iyzlf7nywdc76aj726k8c	nrvc77uqaawbor31e1bx4c9a	nkcapsh3w73irhmhvjhmkulm	SKU-nkcapsh3w73irhmhvjhmkulm	900	EUR	100	0	\N	t	2025-11-25 15:04:27.471	2025-11-25 15:04:27.471	\N
v72vi3u2rj17wflzhswf69a9	nrvc77uqaawbor31e1bx4c9a	xacktx6qms3mrx0dpvmah3t7	SKU-xacktx6qms3mrx0dpvmah3t7	1050	EUR	100	0	\N	t	2025-11-25 15:04:28.423	2025-11-25 15:04:28.423	\N
dokj4774l51c7vqmrbeblrls	nrvc77uqaawbor31e1bx4c9a	hqdsnbw7f23ukt7604yq1cdr	SKU-hqdsnbw7f23ukt7604yq1cdr	1050	EUR	100	0	\N	t	2025-11-25 15:04:29.281	2025-11-25 15:04:29.281	\N
sh3cuzgnvqwqg01ctyqzyzb8	nrvc77uqaawbor31e1bx4c9a	pf5nn1cud6s11f08krw8jvmo	SKU-pf5nn1cud6s11f08krw8jvmo	1050	EUR	100	0	\N	t	2025-11-25 15:04:29.955	2025-11-25 15:04:29.955	\N
yskudurrg4v23ftk2w5fneu9	nrvc77uqaawbor31e1bx4c9a	qy2vrg5h3ke6v6reurxnmso9	SKU-qy2vrg5h3ke6v6reurxnmso9	1050	EUR	100	0	\N	t	2025-11-25 15:04:30.593	2025-11-25 15:04:30.593	\N
on4mfl102eqktpxi86e6ofl0	nrvc77uqaawbor31e1bx4c9a	z922g8wu3q2350rz29yjn3uu	SKU-z922g8wu3q2350rz29yjn3uu	1050	EUR	100	0	\N	t	2025-11-25 15:04:31.261	2025-11-25 15:04:31.261	\N
y2s6hvutt23nqjztl5fd2vv2	nrvc77uqaawbor31e1bx4c9a	futhxuu7lnai2v9zlwvio0li	SKU-futhxuu7lnai2v9zlwvio0li	1050	EUR	100	0	\N	t	2025-11-25 15:04:31.931	2025-11-25 15:04:31.931	\N
ucab6ole9wfyw0z3locyk74z	nrvc77uqaawbor31e1bx4c9a	ja5ti6elx7p9tn1sf268rx11	SKU-ja5ti6elx7p9tn1sf268rx11	2325	EUR	100	0	\N	t	2025-11-25 15:04:32.585	2025-11-25 15:04:32.585	\N
ozc3p84wzm4gng9m5imzmktw	nrvc77uqaawbor31e1bx4c9a	z316n3zv0ljdesri6fizei2l	SKU-z316n3zv0ljdesri6fizei2l	1575	EUR	100	0	\N	t	2025-11-25 15:04:33.282	2025-11-25 15:04:33.282	\N
s0axn7gm4g0q8mi094g166as	nrvc77uqaawbor31e1bx4c9a	i96tyl68hgvk1tzjldodu3uu	SKU-i96tyl68hgvk1tzjldodu3uu	1470	EUR	100	0	\N	t	2025-11-25 15:04:34.033	2025-11-25 15:04:34.033	\N
m5y86yfj1pmk3xxo3ktpsrel	nrvc77uqaawbor31e1bx4c9a	e62h110ps1rrvcqy46yd9hjm	SKU-e62h110ps1rrvcqy46yd9hjm	1695	EUR	100	0	\N	t	2025-11-25 15:04:34.666	2025-11-25 15:04:34.666	\N
mtqq1tmtwpk4sgh8w0iph5il	nrvc77uqaawbor31e1bx4c9a	ypwcnh1d5e54dt8yuxowg1y4	SKU-ypwcnh1d5e54dt8yuxowg1y4	1425	EUR	100	0	\N	t	2025-11-25 15:04:35.299	2025-11-25 15:04:35.299	\N
b1nqrqijynf585rjwmn28a7t	nrvc77uqaawbor31e1bx4c9a	kbsobvnu94j4537r33gfv7fc	SKU-kbsobvnu94j4537r33gfv7fc	1065	EUR	100	0	\N	t	2025-11-25 15:04:35.927	2025-11-25 15:04:35.927	\N
yukfgoerf2ga5rurgpuzvc7s	nrvc77uqaawbor31e1bx4c9a	dqgrkwcft0lbrggjrttxq98d	SKU-dqgrkwcft0lbrggjrttxq98d	3615	EUR	100	0	\N	t	2025-11-25 15:04:36.559	2025-11-25 15:04:36.559	\N
d5r1x7wfo7ho9bslw7gkuy4d	nrvc77uqaawbor31e1bx4c9a	bfr0yte6u57nd8zum6k6j3f8	SKU-bfr0yte6u57nd8zum6k6j3f8	1260	EUR	100	0	\N	t	2025-11-25 15:04:37.194	2025-11-25 15:04:37.194	\N
zelzgn4c1wslvqkbhkaypq74	nrvc77uqaawbor31e1bx4c9a	uc74hgthru2ocuorna6lh3ac	SKU-uc74hgthru2ocuorna6lh3ac	1260	EUR	100	0	\N	t	2025-11-25 15:04:37.822	2025-11-25 15:04:37.822	\N
jlzicd9irdgqnmsujbnyghkk	nrvc77uqaawbor31e1bx4c9a	dxi4tdy9sdry8cyubyj2ftr6	SKU-dxi4tdy9sdry8cyubyj2ftr6	1260	EUR	100	0	\N	t	2025-11-25 15:04:38.46	2025-11-25 15:04:38.46	\N
d9aqgpcwh62jdjkaa9zik7qa	nrvc77uqaawbor31e1bx4c9a	hmy1fqoigm1i1l61akqubkcx	SKU-hmy1fqoigm1i1l61akqubkcx	1260	EUR	100	0	\N	t	2025-11-25 15:04:39.091	2025-11-25 15:04:39.091	\N
mye29s878h8s4tjfx1neasy4	nrvc77uqaawbor31e1bx4c9a	k45abbn6rpnhcw8a75u7yqx9	SKU-k45abbn6rpnhcw8a75u7yqx9	1260	EUR	100	0	\N	t	2025-11-25 15:04:39.792	2025-11-25 15:04:39.792	\N
tix6kb89wjrkgd782ccmlo1m	nrvc77uqaawbor31e1bx4c9a	bxt1dta7tt828qzok6b195wt	SKU-bxt1dta7tt828qzok6b195wt	1260	EUR	100	0	\N	t	2025-11-25 15:04:40.434	2025-11-25 15:04:40.434	\N
gk3wcga75hhjyf0xkyrbib9h	nrvc77uqaawbor31e1bx4c9a	mff93ygxwgmve5l3x9zmypee	SKU-mff93ygxwgmve5l3x9zmypee	1260	EUR	100	0	\N	t	2025-11-25 15:04:41.068	2025-11-25 15:04:41.068	\N
wvi7l0lr062lnuzpcpmagh7p	nrvc77uqaawbor31e1bx4c9a	ncctvb91wh82bott74btiv4c	SKU-ncctvb91wh82bott74btiv4c	1350	EUR	100	0	\N	t	2025-11-25 15:04:41.694	2025-11-25 15:04:41.694	\N
z43vrnds94zyjjt8tijt5cdx	nrvc77uqaawbor31e1bx4c9a	ukngoxfo1h5cg2xzrvnxdhht	SKU-ukngoxfo1h5cg2xzrvnxdhht	1260	EUR	100	0	\N	t	2025-11-25 15:04:42.324	2025-11-25 15:04:42.324	\N
enkzjlbyllh3loskekxf8e4l	nrvc77uqaawbor31e1bx4c9a	nz4ijicawdhwp7wzry8a0kr9	SKU-nz4ijicawdhwp7wzry8a0kr9	1260	EUR	100	0	\N	t	2025-11-25 15:04:42.96	2025-11-25 15:04:42.96	\N
drck42l3vhi335ciyk0gzde3	nrvc77uqaawbor31e1bx4c9a	qs9s7cv3kvk8jx6rpzljxkqq	SKU-qs9s7cv3kvk8jx6rpzljxkqq	1380	EUR	100	0	\N	t	2025-11-25 15:04:43.597	2025-11-25 15:04:43.597	\N
n7pd8bwhzk3oqhliqs86qq5p	nrvc77uqaawbor31e1bx4c9a	mhqikjlommvn2u0xlmlm2ncf	SKU-mhqikjlommvn2u0xlmlm2ncf	1965	EUR	100	0	\N	t	2025-11-25 15:04:44.228	2025-11-25 15:04:44.228	\N
i2lerdxv6s2wep0ir8syh3pe	nrvc77uqaawbor31e1bx4c9a	zvln527slsokg7g7b4q22nau	SKU-zvln527slsokg7g7b4q22nau	2085	EUR	100	0	\N	t	2025-11-25 15:04:44.866	2025-11-25 15:04:44.866	\N
azux3763hvnxe9wa0oisaq5p	nrvc77uqaawbor31e1bx4c9a	x05nknyqtduntv7hf145gnyr	SKU-x05nknyqtduntv7hf145gnyr	1313	EUR	100	0	\N	t	2025-11-25 15:04:45.5	2025-11-25 15:04:45.5	\N
sawws9rogit2p9d5a6v2q9ng	nrvc77uqaawbor31e1bx4c9a	oksadgfw4c383n6aj09psm71	SKU-oksadgfw4c383n6aj09psm71	1598	EUR	100	0	\N	t	2025-11-25 15:04:46.137	2025-11-25 15:04:46.137	\N
c4a7tm633vax0be68mc9r7e8	nrvc77uqaawbor31e1bx4c9a	wub1jleft364jw9x0d47j4pc	SKU-wub1jleft364jw9x0d47j4pc	2850	EUR	100	0	\N	t	2025-11-25 15:04:46.772	2025-11-25 15:04:46.772	\N
ravi6qi7m9oze2wesf2b9wl1	nrvc77uqaawbor31e1bx4c9a	b1w8gj5t569yp4w2h4pokql5	SKU-b1w8gj5t569yp4w2h4pokql5	1725	EUR	100	0	\N	t	2025-11-25 15:04:47.403	2025-11-25 15:04:47.403	\N
z8k6jx314kzokuixdq72jrgy	nrvc77uqaawbor31e1bx4c9a	e4rkymtx2dyv1d29lk2ah607	SKU-e4rkymtx2dyv1d29lk2ah607	2250	EUR	100	0	\N	t	2025-11-25 15:04:48.062	2025-11-25 15:04:48.062	\N
b3vep6svhb8jg70ydi7hhi6y	nrvc77uqaawbor31e1bx4c9a	l50fankjn9m8fgx9x1xz8m96	SKU-l50fankjn9m8fgx9x1xz8m96	1823	EUR	100	0	\N	t	2025-11-25 15:04:48.701	2025-11-25 15:04:48.701	\N
qdm1m622oi7jgynuenzul77y	nrvc77uqaawbor31e1bx4c9a	u3t1f8izbj4qaedw5hptweye	SKU-u3t1f8izbj4qaedw5hptweye	2288	EUR	100	0	\N	t	2025-11-25 15:04:49.354	2025-11-25 15:04:49.354	\N
c853xurmixcid2vomwzp05cp	nrvc77uqaawbor31e1bx4c9a	ohotnw4249fj53l6t9pubjj1	SKU-ohotnw4249fj53l6t9pubjj1	3488	EUR	100	0	\N	t	2025-11-25 15:04:49.984	2025-11-25 15:04:49.984	\N
gds898257csycc8hog3krcew	nrvc77uqaawbor31e1bx4c9a	v949sc4v351thq09kbbky05i	SKU-v949sc4v351thq09kbbky05i	2648	EUR	100	0	\N	t	2025-11-25 15:04:50.616	2025-11-25 15:04:50.616	\N
qa413iwu7yk49dubgw19g5fo	nrvc77uqaawbor31e1bx4c9a	nymqugxtz5kw51lsm4wnbw6e	SKU-nymqugxtz5kw51lsm4wnbw6e	900	EUR	100	0	\N	t	2025-11-25 15:04:51.266	2025-11-25 15:04:51.266	\N
tsd1vxzte1bajadzyc8zmmua	nrvc77uqaawbor31e1bx4c9a	i5ak6xgo18mmltokswdnstgb	SKU-i5ak6xgo18mmltokswdnstgb	3435	EUR	100	0	\N	t	2025-11-25 15:04:51.904	2025-11-25 15:04:51.904	\N
qm2muylv0rmquasyv3asxnum	nrvc77uqaawbor31e1bx4c9a	jknb35qy6cxkr1dhmc99i0lh	SKU-jknb35qy6cxkr1dhmc99i0lh	1388	EUR	100	0	\N	t	2025-11-25 15:04:52.575	2025-11-25 15:04:52.575	\N
wwyi17rn00u8rqsrlzpqd9jo	nrvc77uqaawbor31e1bx4c9a	xeqim2xivhglprd7jfamithu	SKU-xeqim2xivhglprd7jfamithu	1530	EUR	100	0	\N	t	2025-11-25 15:04:53.548	2025-11-25 15:04:53.548	\N
av3keiiou820wzuiimye0mvf	nrvc77uqaawbor31e1bx4c9a	l27otxj8kbo3vziennslu3xt	SKU-l27otxj8kbo3vziennslu3xt	1050	EUR	100	0	\N	t	2025-11-25 15:04:54.185	2025-11-25 15:04:54.185	\N
b7uqbovu9m8pxw4gehoycn4s	nrvc77uqaawbor31e1bx4c9a	l9uwylb2z7lk79kb9vixjku3	SKU-l9uwylb2z7lk79kb9vixjku3	1538	EUR	100	0	\N	t	2025-11-25 15:04:55.177	2025-11-25 15:04:55.177	\N
wxd8kmlvyl3clc7wg7ipuw7a	nrvc77uqaawbor31e1bx4c9a	y6r0oanwp91bhp6unfgvvmym	SKU-y6r0oanwp91bhp6unfgvvmym	1403	EUR	100	0	\N	t	2025-11-25 15:04:55.81	2025-11-25 15:04:55.81	\N
jmjxwqdx99ygpyeawosb5v21	nrvc77uqaawbor31e1bx4c9a	ugjdt725py31n8m2wti0a957	SKU-ugjdt725py31n8m2wti0a957	1973	EUR	100	0	\N	t	2025-11-25 15:04:56.441	2025-11-25 15:04:56.441	\N
rv84yyl8u34vx999jw4afs5t	nrvc77uqaawbor31e1bx4c9a	mgslnilo3k5zb8h60pnyyyfy	SKU-mgslnilo3k5zb8h60pnyyyfy	1305	EUR	100	0	\N	t	2025-11-25 15:04:57.099	2025-11-25 15:04:57.099	\N
d5gnv6gyagg5oovqqyeiigiv	nrvc77uqaawbor31e1bx4c9a	yqn1501tff80xa8oa3m40pkk	SKU-yqn1501tff80xa8oa3m40pkk	3150	EUR	100	0	\N	t	2025-11-25 15:04:57.755	2025-11-25 15:04:57.755	\N
bxj5tghnp7d02l99we83o2mk	nrvc77uqaawbor31e1bx4c9a	twg9ifjq6iqxjlgafl3ab0c2	SKU-twg9ifjq6iqxjlgafl3ab0c2	1875	EUR	100	0	\N	t	2025-11-25 15:04:58.397	2025-11-25 15:04:58.397	\N
b4i5ans1rq2go54vcocynfye	nrvc77uqaawbor31e1bx4c9a	xkv94bwd77fdmu63eu5vw217	SKU-xkv94bwd77fdmu63eu5vw217	2070	EUR	100	0	\N	t	2025-11-25 15:04:59.031	2025-11-25 15:04:59.031	\N
sescu935bfi6ncq1p18z0dob	nrvc77uqaawbor31e1bx4c9a	q0d2hv4k42cwl9q0qgorus7w	SKU-q0d2hv4k42cwl9q0qgorus7w	1538	EUR	100	0	\N	t	2025-11-25 15:04:59.665	2025-11-25 15:04:59.665	\N
m21c7gombpman7w4lhsirvlb	nrvc77uqaawbor31e1bx4c9a	hdd88dibv1brcv0vvid8i62n	SKU-hdd88dibv1brcv0vvid8i62n	1575	EUR	100	0	\N	t	2025-11-25 15:05:00.296	2025-11-25 15:05:00.296	\N
qkf6zggh1636om1np3dedz0e	nrvc77uqaawbor31e1bx4c9a	nqa725kbtfbr2hirsr1gzmc4	SKU-nqa725kbtfbr2hirsr1gzmc4	1620	EUR	100	0	\N	t	2025-11-25 15:05:00.934	2025-11-25 15:05:00.934	\N
sajgfg2kibzvqk9ubh359yva	nrvc77uqaawbor31e1bx4c9a	nn9paf3mp04u5wmmolqsjuo8	SKU-nn9paf3mp04u5wmmolqsjuo8	1598	EUR	100	0	\N	t	2025-11-25 15:05:01.578	2025-11-25 15:05:01.578	\N
ow5rvmvh7xww4qdu7fdqbxgb	nrvc77uqaawbor31e1bx4c9a	lvjlg411f11k60qfkwd00vdj	SKU-lvjlg411f11k60qfkwd00vdj	1485	EUR	100	0	\N	t	2025-11-25 15:05:02.212	2025-11-25 15:05:02.212	\N
obzxqv91b5alo6wiydi0r8tl	nrvc77uqaawbor31e1bx4c9a	y6avefp5zq6nci130jip1vug	SKU-y6avefp5zq6nci130jip1vug	2528	EUR	100	0	\N	t	2025-11-25 15:05:02.849	2025-11-25 15:05:02.849	\N
d0yxdcz6ctr99gffng0rmtuf	nrvc77uqaawbor31e1bx4c9a	ldst5o3c75qtsqxf30tuesso	SKU-ldst5o3c75qtsqxf30tuesso	1395	EUR	100	0	\N	t	2025-11-25 15:05:03.489	2025-11-25 15:05:03.489	\N
zmww9875iomq5rgfbyows90b	nrvc77uqaawbor31e1bx4c9a	lgjg66a3ru4g1sw62gevmrxe	SKU-lgjg66a3ru4g1sw62gevmrxe	1598	EUR	100	0	\N	t	2025-11-25 15:05:04.122	2025-11-25 15:05:04.122	\N
ndwfqycejo8sza5fd79n29md	nrvc77uqaawbor31e1bx4c9a	nju6b9vzoz8d0a47nhmxjcsa	SKU-nju6b9vzoz8d0a47nhmxjcsa	1755	EUR	100	0	\N	t	2025-11-25 15:05:04.763	2025-11-25 15:05:04.763	\N
y87rnkr0mtw03afhga3be6it	nrvc77uqaawbor31e1bx4c9a	bbxmhb24p8eut62yhiv3en76	SKU-bbxmhb24p8eut62yhiv3en76	1395	EUR	100	0	\N	t	2025-11-25 15:05:05.398	2025-11-25 15:05:05.398	\N
bw282lk9omdsfj2zr89ejes2	nrvc77uqaawbor31e1bx4c9a	d4uk7qm1covezgqwvvafmc8t	SKU-d4uk7qm1covezgqwvvafmc8t	2198	EUR	100	0	\N	t	2025-11-25 15:05:06.025	2025-11-25 15:05:06.025	\N
g0u0ivbv19bueq6x6ld13mag	nrvc77uqaawbor31e1bx4c9a	vt14fpak97fa2wgpjc0ytx0k	SKU-vt14fpak97fa2wgpjc0ytx0k	2198	EUR	100	0	\N	t	2025-11-25 15:05:06.657	2025-11-25 15:05:06.657	\N
g1nrkzp3ein2quomnqa7e8xk	nrvc77uqaawbor31e1bx4c9a	r0a5f41m895ct64509jrocuq	SKU-r0a5f41m895ct64509jrocuq	2198	EUR	100	0	\N	t	2025-11-25 15:05:07.286	2025-11-25 15:05:07.286	\N
vwb9gydz5uaqf4w1sxgjezyh	nrvc77uqaawbor31e1bx4c9a	klmotuntuctk877qidtppokp	SKU-klmotuntuctk877qidtppokp	2198	EUR	100	0	\N	t	2025-11-25 15:05:07.917	2025-11-25 15:05:07.917	\N
u5vwqgq7p780wc65dwdq78zx	nrvc77uqaawbor31e1bx4c9a	gs933gvft9ptxu7xpcxph0mv	SKU-gs933gvft9ptxu7xpcxph0mv	2250	EUR	100	0	\N	t	2025-11-25 15:05:08.549	2025-11-25 15:05:08.549	\N
q9no147azac10kli0pjccsqb	nrvc77uqaawbor31e1bx4c9a	ikuit52fzlyao4ld5hpx2hbo	SKU-ikuit52fzlyao4ld5hpx2hbo	2198	EUR	100	0	\N	t	2025-11-25 15:05:09.178	2025-11-25 15:05:09.178	\N
w828sbg69gldvvi30wbsdrtr	nrvc77uqaawbor31e1bx4c9a	yrkwa2daud7g1vx74n5ijvmt	SKU-yrkwa2daud7g1vx74n5ijvmt	2198	EUR	100	0	\N	t	2025-11-25 15:05:09.878	2025-11-25 15:05:09.878	\N
iibdxy57p39v71qm4qcq5dqw	nrvc77uqaawbor31e1bx4c9a	ipvbczt9v9n5oht56cmduzug	SKU-ipvbczt9v9n5oht56cmduzug	2198	EUR	100	0	\N	t	2025-11-25 15:05:10.507	2025-11-25 15:05:10.507	\N
pjpa0ytbt2x2zin9gxizs0xo	nrvc77uqaawbor31e1bx4c9a	he256vjusyo1vwwyoawgly0v	SKU-he256vjusyo1vwwyoawgly0v	1538	EUR	100	0	\N	t	2025-11-25 15:05:11.14	2025-11-25 15:05:11.14	\N
x82ny2zfhd64b2jrn21wacgu	nrvc77uqaawbor31e1bx4c9a	lcrxoqlvnbehz58ece7cvo81	SKU-lcrxoqlvnbehz58ece7cvo81	1388	EUR	100	0	\N	t	2025-11-25 15:05:11.774	2025-11-25 15:05:11.774	\N
sr7v5oddw1h2ka6x7yerd00y	nrvc77uqaawbor31e1bx4c9a	yp610ke14xphny3a89qewyc5	SKU-yp610ke14xphny3a89qewyc5	1403	EUR	100	0	\N	t	2025-11-25 15:05:12.403	2025-11-25 15:05:12.403	\N
gbr8gzb2d9ffjhob0bigmb38	nrvc77uqaawbor31e1bx4c9a	eqnxbvoyfdzpbnturx2fhsi1	SKU-eqnxbvoyfdzpbnturx2fhsi1	2985	EUR	100	0	\N	t	2025-11-25 15:05:13.031	2025-11-25 15:05:13.031	\N
dr90itk4y334of8sx1384p8g	nrvc77uqaawbor31e1bx4c9a	remxoxpq2g7sjviunjaqjdf2	SKU-remxoxpq2g7sjviunjaqjdf2	1373	EUR	100	0	\N	t	2025-11-25 15:05:13.665	2025-11-25 15:05:13.665	\N
mzv0ayyz7vjnliiqmcgsjane	nrvc77uqaawbor31e1bx4c9a	z7rfzueo5vp1ssplntpmhnmg	SKU-z7rfzueo5vp1ssplntpmhnmg	900	EUR	100	0	\N	t	2025-11-25 15:05:14.335	2025-11-25 15:05:14.335	\N
b1w5sgpb1lohfohfmw7h6twq	nrvc77uqaawbor31e1bx4c9a	tnx5o709ecnw7mgyvf921vrx	SKU-tnx5o709ecnw7mgyvf921vrx	1290	EUR	100	0	\N	t	2025-11-25 15:05:14.967	2025-11-25 15:05:14.967	\N
ietaz8bwg4gjjcnbk2fngm5k	nrvc77uqaawbor31e1bx4c9a	xe8j20xe05owo7umkfbnuma0	SKU-xe8j20xe05owo7umkfbnuma0	1530	EUR	100	0	\N	t	2025-11-25 15:05:15.597	2025-11-25 15:05:15.597	\N
n7ymbe43yp9ppw0j4xq70c0y	nrvc77uqaawbor31e1bx4c9a	ida5ljq8al3pmjhxq812qklp	SKU-ida5ljq8al3pmjhxq812qklp	1755	EUR	100	0	\N	t	2025-11-25 15:05:16.238	2025-11-25 15:05:16.238	\N
e3khe27g4s04ep67ys0uugjm	nrvc77uqaawbor31e1bx4c9a	u0vqp5r1glkxsvz25cd005dd	SKU-u0vqp5r1glkxsvz25cd005dd	1913	EUR	100	0	\N	t	2025-11-25 15:05:16.876	2025-11-25 15:05:16.876	\N
dxuwyt689z6n3psu3bxcp492	nrvc77uqaawbor31e1bx4c9a	jp4648prs5uosjals84wlhdy	SKU-jp4648prs5uosjals84wlhdy	975	EUR	100	0	\N	t	2025-11-25 15:05:17.509	2025-11-25 15:05:17.509	\N
fy5vijlc9ddz2enp2zk8aawo	nrvc77uqaawbor31e1bx4c9a	dky02olkpkvsx3gtyeioqaef	SKU-dky02olkpkvsx3gtyeioqaef	3300	EUR	100	0	\N	t	2025-11-25 15:05:18.146	2025-11-25 15:05:18.146	\N
ye38bnaerx3ebvohh89jx0zs	nrvc77uqaawbor31e1bx4c9a	rydam87kyqroyt9sj900j4my	SKU-rydam87kyqroyt9sj900j4my	1350	EUR	100	0	\N	t	2025-11-25 15:05:18.78	2025-11-25 15:05:18.78	\N
uy29ofwbbjbt2hhyvhpc2ulm	nrvc77uqaawbor31e1bx4c9a	sk0cisn4w4f2y7u5e0a6wx92	SKU-sk0cisn4w4f2y7u5e0a6wx92	1755	EUR	100	0	\N	t	2025-11-25 15:05:19.41	2025-11-25 15:05:19.41	\N
t5ryi7xntw5r2ho1b8txlk56	nrvc77uqaawbor31e1bx4c9a	vrr8sbhpmiltb4412zk1zhoe	SKU-vrr8sbhpmiltb4412zk1zhoe	1245	EUR	100	0	\N	t	2025-11-25 15:05:20.04	2025-11-25 15:05:20.04	\N
a5718ri8t11v8ll7qsn68ctr	nrvc77uqaawbor31e1bx4c9a	xfrhv7625z4fpfyejlczj2qk	SKU-xfrhv7625z4fpfyejlczj2qk	1425	EUR	100	0	\N	t	2025-11-25 15:05:20.673	2025-11-25 15:05:20.673	\N
sq0ytkcsdo8k1rrhebr0qtca	nrvc77uqaawbor31e1bx4c9a	x3hdbceadsyoly5ov4eoqhzm	SKU-x3hdbceadsyoly5ov4eoqhzm	1575	EUR	100	0	\N	t	2025-11-25 15:05:21.304	2025-11-25 15:05:21.304	\N
ogd0fnztb70clpb4c7cx98q8	nrvc77uqaawbor31e1bx4c9a	otqmg2ucw24drgz37v39hjb4	SKU-otqmg2ucw24drgz37v39hjb4	1575	EUR	100	0	\N	t	2025-11-25 15:05:21.943	2025-11-25 15:05:21.943	\N
xrv6k2861gzogio9n1okueda	nrvc77uqaawbor31e1bx4c9a	zzhesfq8iosustfiut3hx658	SKU-zzhesfq8iosustfiut3hx658	1223	EUR	100	0	\N	t	2025-11-25 15:05:22.6	2025-11-25 15:05:22.6	\N
xx0zkphuoj718m6c8enj4psz	nrvc77uqaawbor31e1bx4c9a	v1bjro2nwmeishoz52uw8ur9	SKU-v1bjro2nwmeishoz52uw8ur9	555	EUR	100	0	\N	t	2025-11-25 15:05:23.226	2025-11-25 15:05:23.226	\N
ixhw21vrhnvw080tnsanijb6	nrvc77uqaawbor31e1bx4c9a	hwai482gipgkethheogindc5	SKU-hwai482gipgkethheogindc5	1125	EUR	100	0	\N	t	2025-11-25 15:05:23.859	2025-11-25 15:05:23.859	\N
a4z9bkuw6k0ew2618h6d9qdh	nrvc77uqaawbor31e1bx4c9a	gegpdez9ximawzr1dc07qcan	SKU-gegpdez9ximawzr1dc07qcan	1238	EUR	100	0	\N	t	2025-11-25 15:05:24.491	2025-11-25 15:05:24.491	\N
o7l70av19ebeluycc6n6dpy2	nrvc77uqaawbor31e1bx4c9a	nkgxbg4o5tejm3ryivqx02kt	SKU-nkgxbg4o5tejm3ryivqx02kt	1710	EUR	100	0	\N	t	2025-11-25 15:05:25.251	2025-11-25 15:05:25.251	\N
iqqrdzf7o77kyfulim3sbo2i	nrvc77uqaawbor31e1bx4c9a	jezq3ne8wsv5vdle5ht7jzf5	SKU-jezq3ne8wsv5vdle5ht7jzf5	2910	EUR	100	0	\N	t	2025-11-25 15:05:25.885	2025-11-25 15:05:25.885	\N
hg4xw8gnm3q1a96m7d8do8qk	nrvc77uqaawbor31e1bx4c9a	bpbl27fv5wcpt9nbq9fi9bd8	SKU-bpbl27fv5wcpt9nbq9fi9bd8	1275	EUR	100	0	\N	t	2025-11-25 15:05:26.515	2025-11-25 15:05:26.515	\N
r5edveg4pvbppj2qby6dp0uh	nrvc77uqaawbor31e1bx4c9a	iz9k5fb04xrtn935yyjyzlsp	SKU-iz9k5fb04xrtn935yyjyzlsp	1275	EUR	100	0	\N	t	2025-11-25 15:05:27.148	2025-11-25 15:05:27.148	\N
lfabi044lw1cbgfgz4odqp3a	nrvc77uqaawbor31e1bx4c9a	dtpij8axhad71rgkvd1a7beh	SKU-dtpij8axhad71rgkvd1a7beh	1275	EUR	100	0	\N	t	2025-11-25 15:05:27.782	2025-11-25 15:05:27.782	\N
rzl293aayu01rhufxou2yfhj	nrvc77uqaawbor31e1bx4c9a	hfx5k8elt41emguj9rwk08sf	SKU-hfx5k8elt41emguj9rwk08sf	2138	EUR	100	0	\N	t	2025-11-25 15:05:28.41	2025-11-25 15:05:28.41	\N
jv5a6r09gzvjaw9fuamh1lau	nrvc77uqaawbor31e1bx4c9a	my60mliz3k9wk9ypll69hjqm	SKU-my60mliz3k9wk9ypll69hjqm	3563	EUR	100	0	\N	t	2025-11-25 15:05:29.044	2025-11-25 15:05:29.044	\N
limjcyp3d7ytt1d2qi4bbgnz	nrvc77uqaawbor31e1bx4c9a	j4v846a83wflen6blubd8w47	SKU-j4v846a83wflen6blubd8w47	1080	EUR	100	0	\N	t	2025-11-25 15:05:29.673	2025-11-25 15:05:29.673	\N
qgimwdxplqjsyiezlbkp03lj	nrvc77uqaawbor31e1bx4c9a	gblvwr3er5dasc5a3bjnr7sp	SKU-gblvwr3er5dasc5a3bjnr7sp	1238	EUR	100	0	\N	t	2025-11-25 15:05:30.301	2025-11-25 15:05:30.301	\N
j2snptnkjngqdhyl0auc80sw	nrvc77uqaawbor31e1bx4c9a	tkrtcmvmhrk5ajphgophssv5	SKU-tkrtcmvmhrk5ajphgophssv5	990	EUR	100	0	\N	t	2025-11-25 15:05:30.928	2025-11-25 15:05:30.928	\N
n7fjkgki7aatjuqa4is7iqp0	nrvc77uqaawbor31e1bx4c9a	ctr1l2d4nz7qnbl0qt137gjv	SKU-ctr1l2d4nz7qnbl0qt137gjv	1988	EUR	100	0	\N	t	2025-11-25 15:05:31.558	2025-11-25 15:05:31.558	\N
s2o43gln8ijgb11m43wl5cr0	nrvc77uqaawbor31e1bx4c9a	ecfngnr79s2j1b29905tne2e	SKU-ecfngnr79s2j1b29905tne2e	1425	EUR	100	0	\N	t	2025-11-25 15:05:32.252	2025-11-25 15:05:32.252	\N
etbmip67pg3p8ipxeypq3pj6	nrvc77uqaawbor31e1bx4c9a	rg6a9v9vcl71odaqsd0lztfs	SKU-rg6a9v9vcl71odaqsd0lztfs	2535	EUR	100	0	\N	t	2025-11-25 15:05:32.944	2025-11-25 15:05:32.944	\N
pu0l81e70uawvpc8y3whd7br	nrvc77uqaawbor31e1bx4c9a	pab34s72zkjc9i6ffpfo67ca	SKU-pab34s72zkjc9i6ffpfo67ca	1800	EUR	100	0	\N	t	2025-11-25 15:05:33.575	2025-11-25 15:05:33.575	\N
nfamz6918ii2ftdftorxvf5i	nrvc77uqaawbor31e1bx4c9a	lucsqr9qnt2znbbrcgq4ftql	SKU-lucsqr9qnt2znbbrcgq4ftql	3225	EUR	100	0	\N	t	2025-11-25 15:05:34.211	2025-11-25 15:05:34.211	\N
ha9xgtporzo6690qb5btvpzr	nrvc77uqaawbor31e1bx4c9a	gr118qqq607nanwp0zivp8ch	SKU-gr118qqq607nanwp0zivp8ch	2288	EUR	100	0	\N	t	2025-11-25 15:05:34.852	2025-11-25 15:05:34.852	\N
d8fpwqrkpail0t5dkvf0tf86	nrvc77uqaawbor31e1bx4c9a	xesetc0wkwxz0n0s8naz0jzs	SKU-xesetc0wkwxz0n0s8naz0jzs	1395	EUR	100	0	\N	t	2025-11-25 15:05:35.484	2025-11-25 15:05:35.484	\N
nk199ce89rcbwe91jip807j6	nrvc77uqaawbor31e1bx4c9a	sz7ebw0twfrmzzbdurcubdp3	SKU-sz7ebw0twfrmzzbdurcubdp3	480	EUR	100	0	\N	t	2025-11-25 15:05:36.124	2025-11-25 15:05:36.124	\N
xpcn3pcg81cwfu65ik9lmpxp	nrvc77uqaawbor31e1bx4c9a	g6dpe76hhnngp7w8arfh84uv	SKU-g6dpe76hhnngp7w8arfh84uv	1575	EUR	100	0	\N	t	2025-11-25 15:05:36.764	2025-11-25 15:05:36.764	\N
t8splznf69z23q0q1qg52ids	nrvc77uqaawbor31e1bx4c9a	uasyiu1a5pktwip6r471bpu0	SKU-uasyiu1a5pktwip6r471bpu0	1088	EUR	100	0	\N	t	2025-11-25 15:05:37.394	2025-11-25 15:05:37.394	\N
gh5f8shzyogoxd3p48eobm1o	nrvc77uqaawbor31e1bx4c9a	myngum1qh09cltjzu5sqs9r6	SKU-myngum1qh09cltjzu5sqs9r6	900	EUR	100	0	\N	t	2025-11-25 15:05:38.026	2025-11-25 15:05:38.026	\N
irxrlnx1n006rct943k92c84	nrvc77uqaawbor31e1bx4c9a	ss0ryrko3whbl0lfomm21yyy	SKU-ss0ryrko3whbl0lfomm21yyy	975	EUR	100	0	\N	t	2025-11-25 15:05:38.657	2025-11-25 15:05:38.657	\N
bx5tu4qv3vha77b1ix4018gd	nrvc77uqaawbor31e1bx4c9a	b8aq7xj0bavbe4e9naolu9zv	SKU-b8aq7xj0bavbe4e9naolu9zv	1035	EUR	100	0	\N	t	2025-11-25 15:05:39.293	2025-11-25 15:05:39.293	\N
bpaohg1mxqbg6nmpp1sxsifx	nrvc77uqaawbor31e1bx4c9a	mrc3hh8rvlbxiw9or3gtf0f3	SKU-mrc3hh8rvlbxiw9or3gtf0f3	1500	EUR	100	0	\N	t	2025-11-25 15:05:39.92	2025-11-25 15:05:39.92	\N
xfa8src41ejo3m302m0dmt7w	nrvc77uqaawbor31e1bx4c9a	who11mtwyx3v1dqflxp2pt71	SKU-who11mtwyx3v1dqflxp2pt71	450	EUR	100	0	\N	t	2025-11-25 15:05:40.622	2025-11-25 15:05:40.622	\N
btruyr41xnpculujlhrb060z	nrvc77uqaawbor31e1bx4c9a	stzjp37ct3tdccnuxg7fj4p1	SKU-stzjp37ct3tdccnuxg7fj4p1	375	EUR	100	0	\N	t	2025-11-25 15:05:41.255	2025-11-25 15:05:41.255	\N
vb7u6n9u7jaz862numo4krol	nrvc77uqaawbor31e1bx4c9a	hl5e8oijdsf5uzt6oxxjpbl0	SKU-hl5e8oijdsf5uzt6oxxjpbl0	915	EUR	100	0	\N	t	2025-11-25 15:05:41.889	2025-11-25 15:05:41.889	\N
tfcto3ejasj5qtcwbe49l3mr	nrvc77uqaawbor31e1bx4c9a	gd7urjrp7tyf4dua0nmzyp19	SKU-gd7urjrp7tyf4dua0nmzyp19	164	EUR	100	0	\N	t	2025-11-25 15:05:42.516	2025-11-25 15:05:42.516	\N
cmhbk9n59mwev4j1jwy9tb51	nrvc77uqaawbor31e1bx4c9a	qrsfgm7wl6ebshp4s40aqc6e	SKU-qrsfgm7wl6ebshp4s40aqc6e	164	EUR	100	0	\N	t	2025-11-25 15:05:43.178	2025-11-25 15:05:43.178	\N
a6okyihyn26if27k7co0r535	nrvc77uqaawbor31e1bx4c9a	soxdc6l8hhho1nsm2tl03fot	SKU-soxdc6l8hhho1nsm2tl03fot	251	EUR	100	0	\N	t	2025-11-25 15:05:43.836	2025-11-25 15:05:43.836	\N
lzns5ozhlkylj4mq4azc3lr9	nrvc77uqaawbor31e1bx4c9a	h6yq63o4lacbei4yoz9q1pyx	SKU-h6yq63o4lacbei4yoz9q1pyx	2287	EUR	100	0	\N	t	2025-11-25 15:05:44.469	2025-11-25 15:05:44.469	\N
wkynod77kbbez48p8tbw4213	nrvc77uqaawbor31e1bx4c9a	w4fwosmu05pyqixf5ot5n3bu	SKU-w4fwosmu05pyqixf5ot5n3bu	605	EUR	100	0	\N	t	2025-11-25 15:05:45.102	2025-11-25 15:05:45.102	\N
jlgzy9qnxat8kai83owqq20h	nrvc77uqaawbor31e1bx4c9a	w6qrilcuosgyjji6m6kwcu7b	SKU-w6qrilcuosgyjji6m6kwcu7b	1813	EUR	100	0	\N	t	2025-11-25 15:05:45.734	2025-11-25 15:05:45.734	\N
pxuujdi18nqoso6eb6jmbrby	nrvc77uqaawbor31e1bx4c9a	pjqvqkwwjwrt8pgg2kwf4oqr	SKU-pjqvqkwwjwrt8pgg2kwf4oqr	198	EUR	100	0	\N	t	2025-11-25 15:05:46.361	2025-11-25 15:05:46.361	\N
nov8iubglxjdu55mkkiszcof	nrvc77uqaawbor31e1bx4c9a	sh5cw33lsrqyk16kio7hmmi8	SKU-sh5cw33lsrqyk16kio7hmmi8	687	EUR	100	0	\N	t	2025-11-25 15:05:46.989	2025-11-25 15:05:46.989	\N
xsuldm78j7jmnmxvdrg89u2z	nrvc77uqaawbor31e1bx4c9a	fupqup0jbzx086c9973welqt	SKU-fupqup0jbzx086c9973welqt	283	EUR	100	0	\N	t	2025-11-25 15:05:47.617	2025-11-25 15:05:47.617	\N
mrkymzi1houshpjbpqz9wecn	nrvc77uqaawbor31e1bx4c9a	rafkfcyuaot4dql580sl0e7i	SKU-rafkfcyuaot4dql580sl0e7i	340	EUR	100	0	\N	t	2025-11-25 15:05:48.275	2025-11-25 15:05:48.275	\N
oudyfji0t7gmzamq7ozlz6g8	nrvc77uqaawbor31e1bx4c9a	vpypdssg5b19r43dws2zvlgm	SKU-vpypdssg5b19r43dws2zvlgm	368	EUR	100	0	\N	t	2025-11-25 15:05:48.926	2025-11-25 15:05:48.926	\N
au0vfvoruvfxbpneivceezvo	nrvc77uqaawbor31e1bx4c9a	cbieuha9hrelrfl5iwein301	SKU-cbieuha9hrelrfl5iwein301	251	EUR	100	0	\N	t	2025-11-25 15:05:49.559	2025-11-25 15:05:49.559	\N
l0h8gzq6dlfy9djzk3kd2x61	nrvc77uqaawbor31e1bx4c9a	unaorz2xdovixyp2effu741y	SKU-unaorz2xdovixyp2effu741y	469	EUR	100	0	\N	t	2025-11-25 15:05:50.197	2025-11-25 15:05:50.197	\N
ee8zm8r6ycwt2qed87qfjfy3	nrvc77uqaawbor31e1bx4c9a	csag5p6mqfx34mfjninrvc19	SKU-csag5p6mqfx34mfjninrvc19	319	EUR	100	0	\N	t	2025-11-25 15:05:50.828	2025-11-25 15:05:50.828	\N
n2uvpf9xhitvr6ysg4a9jqwk	nrvc77uqaawbor31e1bx4c9a	btzicsk86k8nq5sljmmcywnz	SKU-btzicsk86k8nq5sljmmcywnz	611	EUR	100	0	\N	t	2025-11-25 15:05:51.461	2025-11-25 15:05:51.461	\N
wpjzutnhvm1kznfkzyodlhrl	nrvc77uqaawbor31e1bx4c9a	qi13hmdx3hum30n6api7s1k2	SKU-qi13hmdx3hum30n6api7s1k2	749	EUR	100	0	\N	t	2025-11-25 15:05:52.092	2025-11-25 15:05:52.092	\N
jsy6et6ftvaoogv6h24ll7kp	nrvc77uqaawbor31e1bx4c9a	m2itfvry43oyk279x51mlimq	SKU-m2itfvry43oyk279x51mlimq	598	EUR	100	0	\N	t	2025-11-25 15:05:52.724	2025-11-25 15:05:52.724	\N
q1tf0r63x6u300dseaf225m8	nrvc77uqaawbor31e1bx4c9a	tv8x0kf7m9abgrlbkvas7hm1	SKU-tv8x0kf7m9abgrlbkvas7hm1	283	EUR	100	0	\N	t	2025-11-25 15:05:53.352	2025-11-25 15:05:53.352	\N
auhdkug8sefgt5xyl3m875ai	nrvc77uqaawbor31e1bx4c9a	g9recz88v6yf7j2dphgnhk9n	SKU-g9recz88v6yf7j2dphgnhk9n	192	EUR	100	0	\N	t	2025-11-25 15:05:53.982	2025-11-25 15:05:53.982	\N
adl5955c6pm9x3hva8yvb5f7	nrvc77uqaawbor31e1bx4c9a	n9w14gytzwjylz0k2el6j0r6	SKU-n9w14gytzwjylz0k2el6j0r6	499	EUR	100	0	\N	t	2025-11-25 15:05:54.61	2025-11-25 15:05:54.61	\N
kh18gd4a4fz16d2ex2nanacp	nrvc77uqaawbor31e1bx4c9a	h7th1ym52t9o68oikffhjw5r	SKU-h7th1ym52t9o68oikffhjw5r	368	EUR	100	0	\N	t	2025-11-25 15:05:55.311	2025-11-25 15:05:55.311	\N
bu4aw87ngt8cdnd7q0josohp	nrvc77uqaawbor31e1bx4c9a	rtlfioe196feqybkv058i1m8	SKU-rtlfioe196feqybkv058i1m8	260	EUR	100	0	\N	t	2025-11-25 15:05:55.943	2025-11-25 15:05:55.943	\N
jtkqcqv8m2yljxvd4rzlx5yv	nrvc77uqaawbor31e1bx4c9a	cv7jpcalqtuf9khnmk76vpun	SKU-cv7jpcalqtuf9khnmk76vpun	182	EUR	100	0	\N	t	2025-11-25 15:05:56.589	2025-11-25 15:05:56.589	\N
ckozg98ja2r62screzs9cm8q	nrvc77uqaawbor31e1bx4c9a	y5jn9ice3fza4hhmsj7b646c	SKU-y5jn9ice3fza4hhmsj7b646c	779	EUR	100	0	\N	t	2025-11-25 15:05:57.226	2025-11-25 15:05:57.226	\N
tq0lsduojj9rpap7sqgduqp6	nrvc77uqaawbor31e1bx4c9a	cegvhfahgg647bmhkoo1hzqy	SKU-cegvhfahgg647bmhkoo1hzqy	635	EUR	100	0	\N	t	2025-11-25 15:05:57.855	2025-11-25 15:05:57.855	\N
rk6rqxk6lqc5hxhi81lm5yup	nrvc77uqaawbor31e1bx4c9a	wrdrz8ukix8j16bqdyvkd2rz	SKU-wrdrz8ukix8j16bqdyvkd2rz	687	EUR	100	0	\N	t	2025-11-25 15:05:58.496	2025-11-25 15:05:58.496	\N
w468kgds8uuou5w3c1izz8ba	nrvc77uqaawbor31e1bx4c9a	ws369wgjz6xn4xur8qzu5511	SKU-ws369wgjz6xn4xur8qzu5511	630	EUR	100	0	\N	t	2025-11-25 15:05:59.129	2025-11-25 15:05:59.129	\N
p84angmgz0ry7a3ef8x6bmzu	nrvc77uqaawbor31e1bx4c9a	qw5147bngoyfi17un73q1oks	SKU-qw5147bngoyfi17un73q1oks	1080	EUR	100	0	\N	t	2025-11-25 15:05:59.761	2025-11-25 15:05:59.761	\N
fnjjwztm0atbqf8e0qstyy6j	nrvc77uqaawbor31e1bx4c9a	vqyj4th4hmti1y7b7jra9haq	SKU-vqyj4th4hmti1y7b7jra9haq	1013	EUR	100	0	\N	t	2025-11-25 15:06:00.401	2025-11-25 15:06:00.401	\N
pxb8uwddf1jwx21f96gmw2ut	nrvc77uqaawbor31e1bx4c9a	ofkcayml3a97ru70j7huit3p	SKU-ofkcayml3a97ru70j7huit3p	315	EUR	100	0	\N	t	2025-11-25 15:06:01.037	2025-11-25 15:06:01.037	\N
swmfnkxuckjw8vd0d2w3441x	nrvc77uqaawbor31e1bx4c9a	gm9lpbucfcnwofxmnlswqryh	SKU-gm9lpbucfcnwofxmnlswqryh	524	EUR	100	0	\N	t	2025-11-25 15:06:01.666	2025-11-25 15:06:01.666	\N
h09y04oxriws75ebuwe12goj	nrvc77uqaawbor31e1bx4c9a	qdq4yqgmocnpslf3ka106v77	SKU-qdq4yqgmocnpslf3ka106v77	3910	EUR	100	0	\N	t	2025-11-25 15:06:02.297	2025-11-25 15:06:02.297	\N
kc3z66c311r6s44pid7bywwh	nrvc77uqaawbor31e1bx4c9a	li41uq91me15obqwrg4w2mh0	SKU-li41uq91me15obqwrg4w2mh0	1148	EUR	100	0	\N	t	2025-11-25 15:06:02.924	2025-11-25 15:06:02.924	\N
fllroavrmlg8n6khipsgfdyh	nrvc77uqaawbor31e1bx4c9a	y2vq3xrtfaolkimdgw6y0d3q	SKU-y2vq3xrtfaolkimdgw6y0d3q	9945	EUR	100	0	\N	t	2025-11-25 15:06:03.557	2025-11-25 15:06:03.557	\N
c5k6vefvaf9cww838fxulvo6	nrvc77uqaawbor31e1bx4c9a	tiffxhkolv9hr4j2avuh0j2p	SKU-tiffxhkolv9hr4j2avuh0j2p	2397	EUR	100	0	\N	t	2025-11-25 15:06:04.189	2025-11-25 15:06:04.189	\N
sxu0jbvocvt5kco7i60j9y4j	nrvc77uqaawbor31e1bx4c9a	p1uwf0ompvh0h5dpnmf7xhqh	SKU-p1uwf0ompvh0h5dpnmf7xhqh	3825	EUR	100	0	\N	t	2025-11-25 15:06:04.819	2025-11-25 15:06:04.819	\N
cl4csh3l7dd2x0k5eir586uw	nrvc77uqaawbor31e1bx4c9a	sevd0njv3lz2zlq6xv7p1g9h	SKU-sevd0njv3lz2zlq6xv7p1g9h	1013	EUR	100	0	\N	t	2025-11-25 15:06:05.452	2025-11-25 15:06:05.452	\N
pbu3nm08sc0tcati2uhbbahq	nrvc77uqaawbor31e1bx4c9a	h8ublem2j172nh4mwh7aqe32	SKU-h8ublem2j172nh4mwh7aqe32	1452	EUR	100	0	\N	t	2025-11-25 15:06:06.096	2025-11-25 15:06:06.096	\N
bbslt365yppppiyc2qz7yz9s	nrvc77uqaawbor31e1bx4c9a	kdb1b6h1azo4h9jc6z8wwt1o	SKU-kdb1b6h1azo4h9jc6z8wwt1o	638	EUR	100	0	\N	t	2025-11-25 15:06:06.73	2025-11-25 15:06:06.73	\N
fk5bxxvtqdzqazediiz496er	nrvc77uqaawbor31e1bx4c9a	vqqc91ius38uemuzrgu2hsf7	SKU-vqqc91ius38uemuzrgu2hsf7	876	EUR	100	0	\N	t	2025-11-25 15:06:07.359	2025-11-25 15:06:07.359	\N
z68mrl542cicvch12c14u2wi	nrvc77uqaawbor31e1bx4c9a	nad42i95kwuwwqsdibx1vc9w	SKU-nad42i95kwuwwqsdibx1vc9w	1088	EUR	100	0	\N	t	2025-11-25 15:06:07.996	2025-11-25 15:06:07.996	\N
wspi8b3lko8bfreowf99esvm	nrvc77uqaawbor31e1bx4c9a	dcm6zqpttu9b2y4rb8uv3ny9	SKU-dcm6zqpttu9b2y4rb8uv3ny9	829	EUR	100	0	\N	t	2025-11-25 15:06:08.629	2025-11-25 15:06:08.629	\N
opfec8f5dy4ambxprptwkopa	nrvc77uqaawbor31e1bx4c9a	tnxomlpw90iunl1x95p3l9tg	SKU-tnxomlpw90iunl1x95p3l9tg	907	EUR	100	0	\N	t	2025-11-25 15:06:09.269	2025-11-25 15:06:09.269	\N
k1bj392sjhf7xe09tfzlrv5r	nrvc77uqaawbor31e1bx4c9a	qzhm2u12a3x5ek84l6c3509t	SKU-qzhm2u12a3x5ek84l6c3509t	1735	EUR	100	0	\N	t	2025-11-25 15:06:09.893	2025-11-25 15:06:09.893	\N
j8rtq2gm2z41n1be9lhaofxv	nrvc77uqaawbor31e1bx4c9a	owv57tv5zpwg5gga2y4mvt08	SKU-owv57tv5zpwg5gga2y4mvt08	942	EUR	100	0	\N	t	2025-11-25 15:06:10.595	2025-11-25 15:06:10.595	\N
kaumjwverkbw1z3kkovs7amo	nrvc77uqaawbor31e1bx4c9a	d9ap7goqm7mzo52ezz6i7rtz	SKU-d9ap7goqm7mzo52ezz6i7rtz	18190	EUR	100	0	\N	t	2025-11-25 15:06:11.258	2025-11-25 15:06:11.258	\N
nt72dyb6g6q8cx506gigk70r	nrvc77uqaawbor31e1bx4c9a	dpe9qav7h46i0rbjwq4vpmff	SKU-dpe9qav7h46i0rbjwq4vpmff	1938	EUR	100	0	\N	t	2025-11-25 15:06:11.949	2025-11-25 15:06:11.949	\N
c67jgw5tjss9hwclu8571krj	nrvc77uqaawbor31e1bx4c9a	fzydg1zw3f0zqy8md47gncms	SKU-fzydg1zw3f0zqy8md47gncms	897	EUR	100	0	\N	t	2025-11-25 15:06:12.578	2025-11-25 15:06:12.578	\N
e3xm7b5kg5d2zlobxucahg4d	nrvc77uqaawbor31e1bx4c9a	tr8s6ytiwrfkpt2nt8y3rfwz	SKU-tr8s6ytiwrfkpt2nt8y3rfwz	555	EUR	100	0	\N	t	2025-11-25 15:06:13.213	2025-11-25 15:06:13.213	\N
teij3bwrktbse25uk95ph61o	nrvc77uqaawbor31e1bx4c9a	wvkymet19152dymx5et9kuz8	SKU-wvkymet19152dymx5et9kuz8	305	EUR	100	0	\N	t	2025-11-25 15:06:13.842	2025-11-25 15:06:13.842	\N
rq7sersjye8bco1kw7dgoncb	nrvc77uqaawbor31e1bx4c9a	chjpk00sxnssjyx3ozo1z2sg	SKU-chjpk00sxnssjyx3ozo1z2sg	3443	EUR	100	0	\N	t	2025-11-25 15:06:14.468	2025-11-25 15:06:14.468	\N
mrtoeejoay0si8mfeaoxotiz	nrvc77uqaawbor31e1bx4c9a	sj3yogkgolqbt994zsqgsmbe	SKU-sj3yogkgolqbt994zsqgsmbe	5483	EUR	100	0	\N	t	2025-11-25 15:06:15.105	2025-11-25 15:06:15.105	\N
wko23cbh32l4x2g2p6rj6sn5	nrvc77uqaawbor31e1bx4c9a	cun60okvupxajwjb7sib13kr	SKU-cun60okvupxajwjb7sib13kr	2066	EUR	100	0	\N	t	2025-11-25 15:06:15.735	2025-11-25 15:06:15.735	\N
w3e3njf9lrzqnyi81gwqfi78	nrvc77uqaawbor31e1bx4c9a	cm5378gl5hled5b05no4ejh4	SKU-cm5378gl5hled5b05no4ejh4	2057	EUR	100	0	\N	t	2025-11-25 15:06:16.369	2025-11-25 15:06:16.369	\N
dkjuwic4qy1zh5x162wvh07l	nrvc77uqaawbor31e1bx4c9a	r80u0wq28bfmfzpsreoswnnh	SKU-r80u0wq28bfmfzpsreoswnnh	8245	EUR	100	0	\N	t	2025-11-25 15:06:17.009	2025-11-25 15:06:17.009	\N
bvebjxc6r2j9s2ibhb9kaky4	nrvc77uqaawbor31e1bx4c9a	ddb6q81j89b8idagq4xnt9k6	SKU-ddb6q81j89b8idagq4xnt9k6	616	EUR	100	0	\N	t	2025-11-25 15:06:17.64	2025-11-25 15:06:17.64	\N
gu3fyof4iezuaw3h097drzqd	nrvc77uqaawbor31e1bx4c9a	unntn227bhxqr8rsp0jx0shu	SKU-unntn227bhxqr8rsp0jx0shu	4505	EUR	100	0	\N	t	2025-11-25 15:06:18.276	2025-11-25 15:06:18.276	\N
aevesne169k20h0gg55dmdek	nrvc77uqaawbor31e1bx4c9a	jzki0mnravsva0zjl72viwc4	SKU-jzki0mnravsva0zjl72viwc4	859	EUR	100	0	\N	t	2025-11-25 15:06:18.911	2025-11-25 15:06:18.911	\N
jh1wfmb8n1ml76cqardwq786	nrvc77uqaawbor31e1bx4c9a	q0l07zoc1377f50eb3z2opnf	SKU-q0l07zoc1377f50eb3z2opnf	1412	EUR	100	0	\N	t	2025-11-25 15:06:19.543	2025-11-25 15:06:19.543	\N
ud2t8nf52xidikwnjf1bh9re	nrvc77uqaawbor31e1bx4c9a	u8bsi84mufgxej6utc6oj5lt	SKU-u8bsi84mufgxej6utc6oj5lt	1955	EUR	100	0	\N	t	2025-11-25 15:06:20.175	2025-11-25 15:06:20.175	\N
hlhmirluclrxuxvp6r3yfys3	nrvc77uqaawbor31e1bx4c9a	gi7wu7lx8wvldp8vh191wmgq	SKU-gi7wu7lx8wvldp8vh191wmgq	2083	EUR	100	0	\N	t	2025-11-25 15:06:20.801	2025-11-25 15:06:20.801	\N
h1e3sjwdsh22rmbfu73e7cmq	nrvc77uqaawbor31e1bx4c9a	flb4hk3qdeng7hu326iw4v1f	SKU-flb4hk3qdeng7hu326iw4v1f	2720	EUR	100	0	\N	t	2025-11-25 15:06:21.435	2025-11-25 15:06:21.435	\N
i82tpz23obkb9w8iy7pnvazi	nrvc77uqaawbor31e1bx4c9a	fb94ntjiqfhdjq172v6ulesh	SKU-fb94ntjiqfhdjq172v6ulesh	2338	EUR	100	0	\N	t	2025-11-25 15:06:22.066	2025-11-25 15:06:22.066	\N
c51u7qallsxr973gvzws88n6	nrvc77uqaawbor31e1bx4c9a	xf45oazm29z3m705lmkkstia	SKU-xf45oazm29z3m705lmkkstia	12113	EUR	100	0	\N	t	2025-11-25 15:06:22.696	2025-11-25 15:06:22.696	\N
wfl4rtnkij7wq8h2gqvq4wx9	nrvc77uqaawbor31e1bx4c9a	r7wxtvgmhhdffed72fdyedwh	SKU-r7wxtvgmhhdffed72fdyedwh	23545	EUR	100	0	\N	t	2025-11-25 15:06:23.334	2025-11-25 15:06:23.334	\N
lmjx63psbhzo66tjbx13n07m	nrvc77uqaawbor31e1bx4c9a	tx9ky0czj97evbnr23dqdu88	SKU-tx9ky0czj97evbnr23dqdu88	3060	EUR	100	0	\N	t	2025-11-25 15:06:23.966	2025-11-25 15:06:23.966	\N
pw77pqi1ewnrly0sic8wf4o0	nrvc77uqaawbor31e1bx4c9a	lqbtxzzbvyhu1zre6hxpopxb	SKU-lqbtxzzbvyhu1zre6hxpopxb	3060	EUR	100	0	\N	t	2025-11-25 15:06:24.598	2025-11-25 15:06:24.598	\N
fopwlfflpwlwmx20s3vl51pq	nrvc77uqaawbor31e1bx4c9a	aq96wdk0nfwub6et1t5c4oys	SKU-aq96wdk0nfwub6et1t5c4oys	3273	EUR	100	0	\N	t	2025-11-25 15:06:25.231	2025-11-25 15:06:25.231	\N
bo05e6pknrny475oula9layb	nrvc77uqaawbor31e1bx4c9a	ax5h7tiunsj2mmry7liw67dn	SKU-ax5h7tiunsj2mmry7liw67dn	408	EUR	100	0	\N	t	2025-11-25 15:06:25.927	2025-11-25 15:06:25.927	\N
ib7b8u50uquxpmc1tuygj5bc	nrvc77uqaawbor31e1bx4c9a	fs74jcy5r4djumya7xsus2ja	SKU-fs74jcy5r4djumya7xsus2ja	772	EUR	100	0	\N	t	2025-11-25 15:06:26.558	2025-11-25 15:06:26.558	\N
ro0cwfcf86qi2d1ccep1netb	nrvc77uqaawbor31e1bx4c9a	mh92fru5frn4nzf5n0n5iffj	SKU-mh92fru5frn4nzf5n0n5iffj	408	EUR	100	0	\N	t	2025-11-25 15:06:27.191	2025-11-25 15:06:27.191	\N
aw2fx9353wrbz440c7fva7dr	nrvc77uqaawbor31e1bx4c9a	kmpdkojzoz9bwnkniqzco20a	SKU-kmpdkojzoz9bwnkniqzco20a	1037	EUR	100	0	\N	t	2025-11-25 15:06:27.823	2025-11-25 15:06:27.823	\N
rrq7e6xjwb712hgbbarxc51m	nrvc77uqaawbor31e1bx4c9a	gynu8z2gd5gqod7mqtlgjuiv	SKU-gynu8z2gd5gqod7mqtlgjuiv	510	EUR	100	0	\N	t	2025-11-25 15:09:26.534	2025-11-25 15:09:26.534	\N
khso6zm2e415pbue1q2d3dz7	nrvc77uqaawbor31e1bx4c9a	lnynvfotgz5h1qme4huoxf9o	SKU-lnynvfotgz5h1qme4huoxf9o	751	EUR	100	0	\N	t	2025-11-25 15:09:27.171	2025-11-25 15:09:27.171	\N
phv1klxse6tqgz3yogn6yx9e	nrvc77uqaawbor31e1bx4c9a	lsassh5r02xjy71k8roi5n9u	SKU-lsassh5r02xjy71k8roi5n9u	589	EUR	100	0	\N	t	2025-11-25 15:09:27.803	2025-11-25 15:09:27.803	\N
lld2p38le6rsn4fx5y3qvf7g	nrvc77uqaawbor31e1bx4c9a	theo7gmlnzbwvt3s5m47f5y3	SKU-theo7gmlnzbwvt3s5m47f5y3	1006	EUR	100	0	\N	t	2025-11-25 15:09:28.443	2025-11-25 15:09:28.443	\N
lhglp7sc6dsouzkkru0cby11	nrvc77uqaawbor31e1bx4c9a	v40lj110whvze9td2haku2mf	SKU-v40lj110whvze9td2haku2mf	5032	EUR	100	0	\N	t	2025-11-25 15:09:29.076	2025-11-25 15:09:29.076	\N
fu5s3f25tcs6cm36opjpqa0e	nrvc77uqaawbor31e1bx4c9a	r9675diwo5xftf0go9hzm8s2	SKU-r9675diwo5xftf0go9hzm8s2	1087	EUR	100	0	\N	t	2025-11-25 15:09:29.728	2025-11-25 15:09:29.728	\N
divlu0u4d9shl91kpkdidwlq	nrvc77uqaawbor31e1bx4c9a	z7kzw3wubea0di2m8lljx10u	SKU-z7kzw3wubea0di2m8lljx10u	2397	EUR	100	0	\N	t	2025-11-25 15:09:30.36	2025-11-25 15:09:30.36	\N
xofbhmj3km6fwxltc0su2f6b	nrvc77uqaawbor31e1bx4c9a	e0g13uzuzyp19wvwpii8e7bk	SKU-e0g13uzuzyp19wvwpii8e7bk	1233	EUR	100	0	\N	t	2025-11-25 15:09:30.998	2025-11-25 15:09:30.998	\N
bqftkgedot0mafuu0veqpbvv	nrvc77uqaawbor31e1bx4c9a	mw54lzl7tvr4eaih8i23wt33	SKU-mw54lzl7tvr4eaih8i23wt33	907	EUR	100	0	\N	t	2025-11-25 15:09:31.64	2025-11-25 15:09:31.64	\N
fa35cwhi9d3lr17puip1p10a	nrvc77uqaawbor31e1bx4c9a	p197zkcbzh2m17kvrdyhd0rn	SKU-p197zkcbzh2m17kvrdyhd0rn	2933	EUR	100	0	\N	t	2025-11-25 15:09:32.272	2025-11-25 15:09:32.272	\N
tc13pppv3odbfxrzsul8q3vn	nrvc77uqaawbor31e1bx4c9a	l31ygxfaduvk5nt9e3bghqqz	SKU-l31ygxfaduvk5nt9e3bghqqz	6460	EUR	100	0	\N	t	2025-11-25 15:09:32.908	2025-11-25 15:09:32.908	\N
wzc6vtthgjvw28qvvag787ot	nrvc77uqaawbor31e1bx4c9a	i2014h2iezgezqhr3dx4xb3a	SKU-i2014h2iezgezqhr3dx4xb3a	754	EUR	100	0	\N	t	2025-11-25 15:09:33.544	2025-11-25 15:09:33.544	\N
axzaaoqrll6rkvjss4szle7n	nrvc77uqaawbor31e1bx4c9a	sbba024j6ev2lraq64s7mrn8	SKU-sbba024j6ev2lraq64s7mrn8	754	EUR	100	0	\N	t	2025-11-25 15:09:34.186	2025-11-25 15:09:34.186	\N
njc4hfrl6o158oartg7lbfgi	nrvc77uqaawbor31e1bx4c9a	mrb8sq9yq47rmwu5fxxlqm48	SKU-mrb8sq9yq47rmwu5fxxlqm48	766	EUR	100	0	\N	t	2025-11-25 15:09:34.82	2025-11-25 15:09:34.82	\N
m2mwlth6hc7zqt9rpk9vubha	nrvc77uqaawbor31e1bx4c9a	t7ymupwj9lr80oc4n4dsjc43	SKU-t7ymupwj9lr80oc4n4dsjc43	1811	EUR	100	0	\N	t	2025-11-25 15:09:35.458	2025-11-25 15:09:35.458	\N
gaez0wblwxlrl85mamr10m6y	nrvc77uqaawbor31e1bx4c9a	iu7ngltvlx4ot3p8xguzv3pi	SKU-iu7ngltvlx4ot3p8xguzv3pi	1014	EUR	100	0	\N	t	2025-11-25 15:09:36.093	2025-11-25 15:09:36.093	\N
z9pk1xa6s3h0zbn92wheyt4u	nrvc77uqaawbor31e1bx4c9a	z8esrzqxr66lc8z85pwyhaio	SKU-z8esrzqxr66lc8z85pwyhaio	13515	EUR	100	0	\N	t	2025-11-25 15:09:36.73	2025-11-25 15:09:36.73	\N
b6eug1cilksgerz7zp8xilev	nrvc77uqaawbor31e1bx4c9a	akgsrb1u2riokusxuxd0vioe	SKU-akgsrb1u2riokusxuxd0vioe	2057	EUR	100	0	\N	t	2025-11-25 15:09:37.369	2025-11-25 15:09:37.369	\N
ne1xb2p75wl96ll6qu3xecih	nrvc77uqaawbor31e1bx4c9a	cqgdtjg65ydwynn47g8j2stz	SKU-cqgdtjg65ydwynn47g8j2stz	520	EUR	100	0	\N	t	2025-11-25 15:09:38.011	2025-11-25 15:09:38.011	\N
zufb9cxg32qkw7ehc1za1155	nrvc77uqaawbor31e1bx4c9a	j5rk3lqc8dfprzwjwiqz3nxy	SKU-j5rk3lqc8dfprzwjwiqz3nxy	772	EUR	100	0	\N	t	2025-11-25 15:09:38.652	2025-11-25 15:09:38.652	\N
k3coa2dsug25vsdqe07dn39o	nrvc77uqaawbor31e1bx4c9a	ey6mdox802b559a8ic5vhbnx	SKU-ey6mdox802b559a8ic5vhbnx	1006	EUR	100	0	\N	t	2025-11-25 15:09:39.38	2025-11-25 15:09:39.38	\N
je204lyjhwei2d6aqkmcyfhq	nrvc77uqaawbor31e1bx4c9a	gp9b68g9c4supg9gyqmoqipx	SKU-gp9b68g9c4supg9gyqmoqipx	9180	EUR	100	0	\N	t	2025-11-25 15:09:40.018	2025-11-25 15:09:40.018	\N
vn1a8f20i7864vsnq1edy58h	nrvc77uqaawbor31e1bx4c9a	qi13kxaaq3zetp4kajxii1ds	SKU-qi13kxaaq3zetp4kajxii1ds	952	EUR	100	0	\N	t	2025-11-25 15:09:40.658	2025-11-25 15:09:40.658	\N
phcwejclx937opgl38p4zbzs	nrvc77uqaawbor31e1bx4c9a	vws2ww83sf5rvwfa3y3alpln	SKU-vws2ww83sf5rvwfa3y3alpln	662	EUR	100	0	\N	t	2025-11-25 15:09:41.292	2025-11-25 15:09:41.292	\N
cejo0mnz9gyjwd1p3epz3guz	nrvc77uqaawbor31e1bx4c9a	rv14osqztzw118581ixtzpce	SKU-rv14osqztzw118581ixtzpce	1683	EUR	100	0	\N	t	2025-11-25 15:09:41.927	2025-11-25 15:09:41.927	\N
qk11aoqps86eceuevtgw0u56	nrvc77uqaawbor31e1bx4c9a	cykhgx30xuitngd4u6cfivpi	SKU-cykhgx30xuitngd4u6cfivpi	772	EUR	100	0	\N	t	2025-11-25 15:09:42.565	2025-11-25 15:09:42.565	\N
qiqe2jsvt8nr7y9hiduuh9jm	nrvc77uqaawbor31e1bx4c9a	jwqk1bd17p3sfqjo26kn7sqw	SKU-jwqk1bd17p3sfqjo26kn7sqw	1190	EUR	100	0	\N	t	2025-11-25 15:09:43.199	2025-11-25 15:09:43.199	\N
v54qrydyf4exzfty4a41crkp	nrvc77uqaawbor31e1bx4c9a	j3iko44kznwl62nz6e5j3nid	SKU-j3iko44kznwl62nz6e5j3nid	1223	EUR	100	0	\N	t	2025-11-25 15:09:43.834	2025-11-25 15:09:43.834	\N
vsr4ywzfb6fmvk63pdn0gp78	nrvc77uqaawbor31e1bx4c9a	oixasbttivk0kk1rpht22xi3	SKU-oixasbttivk0kk1rpht22xi3	844	EUR	100	0	\N	t	2025-11-25 15:09:44.475	2025-11-25 15:09:44.475	\N
kfio2r5bbnt70xdf7oi5mmor	nrvc77uqaawbor31e1bx4c9a	vq1zn3wvqkzrlz2rsbqabpc9	SKU-vq1zn3wvqkzrlz2rsbqabpc9	1235	EUR	100	0	\N	t	2025-11-25 15:09:45.151	2025-11-25 15:09:45.151	\N
jqzutzb3hygd69i7osg6jd8x	nrvc77uqaawbor31e1bx4c9a	h4c36zzi902tdy4cb45whb8i	SKU-h4c36zzi902tdy4cb45whb8i	843	EUR	100	0	\N	t	2025-11-25 15:09:45.788	2025-11-25 15:09:45.788	\N
hrngnmstc1oe63hzcmv4ynjj	nrvc77uqaawbor31e1bx4c9a	o90jj3a25x55hnev2qcnix80	SKU-o90jj3a25x55hnev2qcnix80	910	EUR	100	0	\N	t	2025-11-25 15:09:46.424	2025-11-25 15:09:46.424	\N
mplqwo0varq0mftc5cq5n20d	nrvc77uqaawbor31e1bx4c9a	xobforhcn9vyh1cyq5g3kbzm	SKU-xobforhcn9vyh1cyq5g3kbzm	1632	EUR	100	0	\N	t	2025-11-25 15:09:47.081	2025-11-25 15:09:47.081	\N
qsh6ta8xwmc0hhe5altv8b92	nrvc77uqaawbor31e1bx4c9a	xrkodjk9d32xhtfe6spu8zj4	SKU-xrkodjk9d32xhtfe6spu8zj4	468	EUR	100	0	\N	t	2025-11-25 15:09:47.714	2025-11-25 15:09:47.714	\N
gfpbdo4zg5oofp4k7bm7n2fx	nrvc77uqaawbor31e1bx4c9a	clpwrs83ttsqc851nuru3ugd	SKU-clpwrs83ttsqc851nuru3ugd	1133	EUR	100	0	\N	t	2025-11-25 15:09:48.353	2025-11-25 15:09:48.353	\N
exzf2egmwncd82pmoumkl7yj	nrvc77uqaawbor31e1bx4c9a	fcvcauemy1rje1g0o63xo9ws	SKU-fcvcauemy1rje1g0o63xo9ws	1043	EUR	100	0	\N	t	2025-11-25 15:09:48.99	2025-11-25 15:09:48.99	\N
r7s0jv4ru4bomkyq1tk6x6k9	nrvc77uqaawbor31e1bx4c9a	bw1wwu2i1aqxar8co39zjrb7	SKU-bw1wwu2i1aqxar8co39zjrb7	565	EUR	100	0	\N	t	2025-11-25 15:09:49.626	2025-11-25 15:09:49.626	\N
vvnjaueu7wjluklfil86901u	nrvc77uqaawbor31e1bx4c9a	x5kpjehbw8vqpu6s6emrus3k	SKU-x5kpjehbw8vqpu6s6emrus3k	711	EUR	100	0	\N	t	2025-11-25 15:09:50.27	2025-11-25 15:09:50.27	\N
lkpc94m163qir6ba3lc9vpua	nrvc77uqaawbor31e1bx4c9a	fh9919f5asls1kh4goyfx325	SKU-fh9919f5asls1kh4goyfx325	5440	EUR	100	0	\N	t	2025-11-25 15:09:50.907	2025-11-25 15:09:50.907	\N
d4qxrq3jn8ziy4w7rqqh58dw	nrvc77uqaawbor31e1bx4c9a	wbhkrhhbkz6ks9k0peziz9o5	SKU-wbhkrhhbkz6ks9k0peziz9o5	1293	EUR	100	0	\N	t	2025-11-25 15:09:51.541	2025-11-25 15:09:51.541	\N
uodp57am1u5x6489sersrr0z	nrvc77uqaawbor31e1bx4c9a	ac3u24x2arzo2y1xv8sicc0w	SKU-ac3u24x2arzo2y1xv8sicc0w	2805	EUR	100	0	\N	t	2025-11-25 15:09:52.178	2025-11-25 15:09:52.178	\N
an30qrmenqxsuyua3nyqrvdr	nrvc77uqaawbor31e1bx4c9a	xw5wn6stzm8m6t5m42mizwr0	SKU-xw5wn6stzm8m6t5m42mizwr0	3885	EUR	100	0	\N	t	2025-11-25 15:09:52.818	2025-11-25 15:09:52.818	\N
lpyahvmo9w63igzz7q7j2x7i	nrvc77uqaawbor31e1bx4c9a	kkxoki1gmi4w1xnm1fuagb95	SKU-kkxoki1gmi4w1xnm1fuagb95	5058	EUR	100	0	\N	t	2025-11-25 15:09:53.455	2025-11-25 15:09:53.455	\N
frhfe29eogkvh6drvgf61zq3	nrvc77uqaawbor31e1bx4c9a	az6bjimcwlwqjhiul41p27z6	SKU-az6bjimcwlwqjhiul41p27z6	1054	EUR	100	0	\N	t	2025-11-25 15:09:54.104	2025-11-25 15:09:54.104	\N
gvkye4lz37iee7ceafhmrfjz	nrvc77uqaawbor31e1bx4c9a	gdi283bnmbit6bfwgf3rpnil	SKU-gdi283bnmbit6bfwgf3rpnil	1360	EUR	100	0	\N	t	2025-11-25 15:09:54.826	2025-11-25 15:09:54.826	\N
jvjqbs6hjd2w81foyx4yw4zo	nrvc77uqaawbor31e1bx4c9a	jvj2l0lb7hmlr2nu99l7jnyu	SKU-jvj2l0lb7hmlr2nu99l7jnyu	2763	EUR	100	0	\N	t	2025-11-25 15:09:55.471	2025-11-25 15:09:55.471	\N
c3mh37buv63ky0m3ud4sbl8u	nrvc77uqaawbor31e1bx4c9a	wl7nlvmxpw27etlo3hawbzkq	SKU-wl7nlvmxpw27etlo3hawbzkq	5831	EUR	100	0	\N	t	2025-11-25 15:09:56.113	2025-11-25 15:09:56.113	\N
j9yy0r1pz5nng6wzq2ah8bj2	nrvc77uqaawbor31e1bx4c9a	zgkleypasdg7i2b05jjs96qb	SKU-zgkleypasdg7i2b05jjs96qb	2720	EUR	100	0	\N	t	2025-11-25 15:09:56.746	2025-11-25 15:09:56.746	\N
tenk2ozncn6u127cwap32hnz	nrvc77uqaawbor31e1bx4c9a	xxq2tq2c9kt188v5ctusr649	SKU-xxq2tq2c9kt188v5ctusr649	2066	EUR	100	0	\N	t	2025-11-25 15:09:57.386	2025-11-25 15:09:57.386	\N
hs0yw7tdzgp01uloyjl911al	nrvc77uqaawbor31e1bx4c9a	wamybsifg6lvn3607lc9r09n	SKU-wamybsifg6lvn3607lc9r09n	2125	EUR	100	0	\N	t	2025-11-25 15:09:58.022	2025-11-25 15:09:58.022	\N
m0f8cjdgq3xputlk1nwho28h	nrvc77uqaawbor31e1bx4c9a	gzftsjprep01lz828gflpjdx	SKU-gzftsjprep01lz828gflpjdx	1870	EUR	100	0	\N	t	2025-11-25 15:09:58.653	2025-11-25 15:09:58.653	\N
aqtalae4e4eb9axm8sxpnvit	nrvc77uqaawbor31e1bx4c9a	xafxhznwgsgxw2fjqimlqojg	SKU-xafxhznwgsgxw2fjqimlqojg	4420	EUR	100	0	\N	t	2025-11-25 15:09:59.294	2025-11-25 15:09:59.294	\N
qw67jr91k09rms7hs3blc3wx	nrvc77uqaawbor31e1bx4c9a	xn42bd2jv02jvmgadtp1soos	SKU-xn42bd2jv02jvmgadtp1soos	4420	EUR	100	0	\N	t	2025-11-25 15:09:59.928	2025-11-25 15:09:59.928	\N
k1b2xhj76s5c73wy7eeb5jxu	nrvc77uqaawbor31e1bx4c9a	ukhvpsv2i0ysoqar9ftqbid1	SKU-ukhvpsv2i0ysoqar9ftqbid1	4420	EUR	100	0	\N	t	2025-11-25 15:10:00.564	2025-11-25 15:10:00.564	\N
mrfj6ea7k5m3jtf1uueir845	nrvc77uqaawbor31e1bx4c9a	kkuy2cgiqquciyfaq0rm6u4q	SKU-kkuy2cgiqquciyfaq0rm6u4q	4973	EUR	100	0	\N	t	2025-11-25 15:10:01.201	2025-11-25 15:10:01.201	\N
v2hqhq5ffmc1t5nwmy3328vf	nrvc77uqaawbor31e1bx4c9a	if8ml1uk99631ybpigf7um51	SKU-if8ml1uk99631ybpigf7um51	5015	EUR	100	0	\N	t	2025-11-25 15:10:01.841	2025-11-25 15:10:01.841	\N
b5val2nst1x998verqbv0eft	nrvc77uqaawbor31e1bx4c9a	tcog9nngj641bjeer641tct7	SKU-tcog9nngj641bjeer641tct7	4488	EUR	100	0	\N	t	2025-11-25 15:10:02.502	2025-11-25 15:10:02.502	\N
pyxqfwgor3zx0bt3yd9bh5d3	nrvc77uqaawbor31e1bx4c9a	vtc3jc5eppsoelygw889fwlv	SKU-vtc3jc5eppsoelygw889fwlv	1020	EUR	100	0	\N	t	2025-11-25 15:10:03.139	2025-11-25 15:10:03.139	\N
wh8ebzotvursbroslkzln60e	nrvc77uqaawbor31e1bx4c9a	x47d5b3xfh2e1jkab3etfsgw	SKU-x47d5b3xfh2e1jkab3etfsgw	4488	EUR	100	0	\N	t	2025-11-25 15:10:03.772	2025-11-25 15:10:03.772	\N
avusht3lp960vg3i2oossacg	nrvc77uqaawbor31e1bx4c9a	g94cq5qdh42ha1fzkchnw99t	SKU-g94cq5qdh42ha1fzkchnw99t	5015	EUR	100	0	\N	t	2025-11-25 15:10:04.417	2025-11-25 15:10:04.417	\N
dlzavh9bv3t0reitwt6a3ewz	nrvc77uqaawbor31e1bx4c9a	jgczwu1g02eomva5ik66pcn2	SKU-jgczwu1g02eomva5ik66pcn2	1020	EUR	100	0	\N	t	2025-11-25 15:10:05.051	2025-11-25 15:10:05.051	\N
ur7djjg04tsg2thk2hzz3m70	nrvc77uqaawbor31e1bx4c9a	zo9132tpc9wc4qqp63pz48uz	SKU-zo9132tpc9wc4qqp63pz48uz	4335	EUR	100	0	\N	t	2025-11-25 15:10:05.693	2025-11-25 15:10:05.693	\N
l28udwf940ajliq9zrlbg3du	nrvc77uqaawbor31e1bx4c9a	s2syv9uqvfxmphitype1vvcm	SKU-s2syv9uqvfxmphitype1vvcm	672	EUR	100	0	\N	t	2025-11-25 15:10:06.329	2025-11-25 15:10:06.329	\N
w97a4annpndtb9cxnwft64rw	nrvc77uqaawbor31e1bx4c9a	fqbc749p6tbsog1jy8ysxuco	SKU-fqbc749p6tbsog1jy8ysxuco	544	EUR	100	0	\N	t	2025-11-25 15:10:06.963	2025-11-25 15:10:06.963	\N
qjk8yjny02s5da2n8l23vn2n	nrvc77uqaawbor31e1bx4c9a	tvhupumkbipspp7wue5y5eu2	SKU-tvhupumkbipspp7wue5y5eu2	4378	EUR	100	0	\N	t	2025-11-25 15:10:07.599	2025-11-25 15:10:07.599	\N
r3umzfyzb80c760aw1mkyk1k	nrvc77uqaawbor31e1bx4c9a	bxbb4sah32ujxad3jbxereec	SKU-bxbb4sah32ujxad3jbxereec	5202	EUR	100	0	\N	t	2025-11-25 15:10:08.23	2025-11-25 15:10:08.23	\N
kn3d4mtx6luwlgywrunvs56w	nrvc77uqaawbor31e1bx4c9a	y59lxt1s00cli8tcka7zh6pl	SKU-y59lxt1s00cli8tcka7zh6pl	5202	EUR	100	0	\N	t	2025-11-25 15:10:08.867	2025-11-25 15:10:08.867	\N
ud1q2biy7xjqy5gfhmvg9thf	nrvc77uqaawbor31e1bx4c9a	q5crnjuxakv409vgbyz5p2sm	SKU-q5crnjuxakv409vgbyz5p2sm	8415	EUR	100	0	\N	t	2025-11-25 15:10:09.571	2025-11-25 15:10:09.571	\N
rb06dduln6vgdzhk9z7vb4jx	nrvc77uqaawbor31e1bx4c9a	vwpxckv3go54v4mplog2fm56	SKU-vwpxckv3go54v4mplog2fm56	5211	EUR	100	0	\N	t	2025-11-25 15:10:10.204	2025-11-25 15:10:10.204	\N
qe36yjjbna736hwpnoop66oy	nrvc77uqaawbor31e1bx4c9a	vact2c8ikkd6tfa8x6rfyd8k	SKU-vact2c8ikkd6tfa8x6rfyd8k	4930	EUR	100	0	\N	t	2025-11-25 15:10:10.836	2025-11-25 15:10:10.836	\N
btzzvtbeqfg3obgxk7s2b7mn	nrvc77uqaawbor31e1bx4c9a	mbhegnh4408fne3fz5vxaebd	SKU-mbhegnh4408fne3fz5vxaebd	4862	EUR	100	0	\N	t	2025-11-25 15:10:11.487	2025-11-25 15:10:11.487	\N
n0zt0jiw1l5vxowcx23g1xbw	nrvc77uqaawbor31e1bx4c9a	wg0eclpjeb4ovize6074ki7x	SKU-wg0eclpjeb4ovize6074ki7x	5270	EUR	100	0	\N	t	2025-11-25 15:10:12.123	2025-11-25 15:10:12.123	\N
ki3lsx3juztrwad2wwqgco3k	nrvc77uqaawbor31e1bx4c9a	pjuus70wuqdqk34tm6n2kpac	SKU-pjuus70wuqdqk34tm6n2kpac	3783	EUR	100	0	\N	t	2025-11-25 15:10:12.769	2025-11-25 15:10:12.769	\N
ymqc6g842h5tzn0ce1aiwg86	nrvc77uqaawbor31e1bx4c9a	k2e7o37c1m1uc6aifl3i86qk	SKU-k2e7o37c1m1uc6aifl3i86qk	3315	EUR	100	0	\N	t	2025-11-25 15:10:13.407	2025-11-25 15:10:13.407	\N
p2irkop3wdejber48dgg3sp1	nrvc77uqaawbor31e1bx4c9a	i3qx4hx5ode57f33x40a40c4	SKU-i3qx4hx5ode57f33x40a40c4	30685	EUR	100	0	\N	t	2025-11-25 15:10:14.047	2025-11-25 15:10:14.047	\N
qavotda6sws4idmuec831rol	nrvc77uqaawbor31e1bx4c9a	qayowj0kfblv0atu8mcrui0d	SKU-qayowj0kfblv0atu8mcrui0d	7098	EUR	100	0	\N	t	2025-11-25 15:10:14.683	2025-11-25 15:10:14.683	\N
q9zstko5tronzf786jxlxvrl	nrvc77uqaawbor31e1bx4c9a	un86kul1b47b4ux6e2dze1cc	SKU-un86kul1b47b4ux6e2dze1cc	6248	EUR	100	0	\N	t	2025-11-25 15:10:15.324	2025-11-25 15:10:15.324	\N
n2qsc9i8n2g03okhgejzv2lp	nrvc77uqaawbor31e1bx4c9a	aepb6ruaqpdf5znntnzada4d	SKU-aepb6ruaqpdf5znntnzada4d	6248	EUR	100	0	\N	t	2025-11-25 15:10:15.961	2025-11-25 15:10:15.961	\N
llphou39bkh3yhco1m0gt5ur	nrvc77uqaawbor31e1bx4c9a	g4ix9ahhg7a0b9mlbj3pp4sh	SKU-g4ix9ahhg7a0b9mlbj3pp4sh	5245	EUR	100	0	\N	t	2025-11-25 15:10:16.592	2025-11-25 15:10:16.592	\N
xoxlz6istx0pxme3gybk9xbk	nrvc77uqaawbor31e1bx4c9a	h95f2a9gv48sygq9bgjcmf54	SKU-h95f2a9gv48sygq9bgjcmf54	11050	EUR	100	0	\N	t	2025-11-25 15:10:17.24	2025-11-25 15:10:17.24	\N
k4sd8g7unbz9tz6o3of3iw0z	nrvc77uqaawbor31e1bx4c9a	a2yys2syncmw1g7w2zzm1f2h	SKU-a2yys2syncmw1g7w2zzm1f2h	5908	EUR	100	0	\N	t	2025-11-25 15:10:17.873	2025-11-25 15:10:17.873	\N
zuqqooqq95xoaif3w9pa06rs	nrvc77uqaawbor31e1bx4c9a	ibxnu6knzjsflasmcvpyiqs3	SKU-ibxnu6knzjsflasmcvpyiqs3	30600	EUR	100	0	\N	t	2025-11-25 15:10:18.507	2025-11-25 15:10:18.507	\N
r30grl40ojimkqelagex9yvm	nrvc77uqaawbor31e1bx4c9a	r09w0ypu81fgv7bo412hoe93	SKU-r09w0ypu81fgv7bo412hoe93	2210	EUR	100	0	\N	t	2025-11-25 15:10:19.139	2025-11-25 15:10:19.139	\N
fzx8m6u6wg1o4x6ume7mi9wz	nrvc77uqaawbor31e1bx4c9a	rm89tqkvggrtykgu59plbfao	SKU-rm89tqkvggrtykgu59plbfao	32980	EUR	100	0	\N	t	2025-11-25 15:10:19.775	2025-11-25 15:10:19.775	\N
zrbd7fh73koxf0wg58ve6u0i	nrvc77uqaawbor31e1bx4c9a	fc67gxz19qvjv0iql7y62fd8	SKU-fc67gxz19qvjv0iql7y62fd8	73440	EUR	100	0	\N	t	2025-11-25 15:10:20.411	2025-11-25 15:10:20.411	\N
kqx4srbr5u3jnbw6f6ifycv8	nrvc77uqaawbor31e1bx4c9a	szug2ms88joru7xg44hobe8a	SKU-szug2ms88joru7xg44hobe8a	6732	EUR	100	0	\N	t	2025-11-25 15:10:21.058	2025-11-25 15:10:21.058	\N
gwsgj0me3ibfoi8qoxwbksj4	nrvc77uqaawbor31e1bx4c9a	flumnauea3tcqvpmr8ckijai	SKU-flumnauea3tcqvpmr8ckijai	18700	EUR	100	0	\N	t	2025-11-25 15:10:21.69	2025-11-25 15:10:21.69	\N
pcjdqfuh49qb39zv87fb3juq	nrvc77uqaawbor31e1bx4c9a	ngvca5wdr9zdj4gtrooa5u98	SKU-ngvca5wdr9zdj4gtrooa5u98	8160	EUR	100	0	\N	t	2025-11-25 15:10:22.333	2025-11-25 15:10:22.333	\N
vd8qvyafw644pcx3ha4j2o9q	nrvc77uqaawbor31e1bx4c9a	ve85jzj3ywxt7y4i9lp7y85h	SKU-ve85jzj3ywxt7y4i9lp7y85h	9520	EUR	100	0	\N	t	2025-11-25 15:10:22.968	2025-11-25 15:10:22.968	\N
j6d6dy4dp8ax8n5mwvzqp94i	nrvc77uqaawbor31e1bx4c9a	ykj309z6x7mdahbhnt6d95x6	SKU-ykj309z6x7mdahbhnt6d95x6	5151	EUR	100	0	\N	t	2025-11-25 15:10:23.608	2025-11-25 15:10:23.608	\N
rop67dto8sde0x8o4672szfe	nrvc77uqaawbor31e1bx4c9a	n1shorexuqa7j2zvacyhos1i	SKU-n1shorexuqa7j2zvacyhos1i	9180	EUR	100	0	\N	t	2025-11-25 15:10:24.248	2025-11-25 15:10:24.248	\N
jj0lsdi89zuv6jk95xbn4htz	nrvc77uqaawbor31e1bx4c9a	a4cvfl35k9r7t4d2om36noe1	SKU-a4cvfl35k9r7t4d2om36noe1	4930	EUR	100	0	\N	t	2025-11-25 15:10:24.956	2025-11-25 15:10:24.956	\N
zu4fxu8iwofcjoc29osilkbs	nrvc77uqaawbor31e1bx4c9a	hexy3pcys3zegfxvo0lckqhw	SKU-hexy3pcys3zegfxvo0lckqhw	33660	EUR	100	0	\N	t	2025-11-25 15:10:25.587	2025-11-25 15:10:25.587	\N
aa8gxecaej7a0jd1wre16ygd	nrvc77uqaawbor31e1bx4c9a	t2iuhgqnw3qpjbvbfsuvvw3v	SKU-t2iuhgqnw3qpjbvbfsuvvw3v	949	EUR	100	0	\N	t	2025-11-25 15:10:26.224	2025-11-25 15:10:26.224	\N
a3qlju2f9sb7bpdpbm2asjk3	nrvc77uqaawbor31e1bx4c9a	vipfgjpwhpizyjv5m0599n0e	SKU-vipfgjpwhpizyjv5m0599n0e	616	EUR	100	0	\N	t	2025-11-25 15:10:26.862	2025-11-25 15:10:26.862	\N
dr9b4xt87bivszu0zkyfr074	nrvc77uqaawbor31e1bx4c9a	tduhaca17qmsagh2v5og2mty	SKU-tduhaca17qmsagh2v5og2mty	1686	EUR	100	0	\N	t	2025-11-25 15:10:27.509	2025-11-25 15:10:27.509	\N
pokjpcmvtivy3kwr3yuhaazs	nrvc77uqaawbor31e1bx4c9a	q4jbdedt7z8kajy8y9ysitl8	SKU-q4jbdedt7z8kajy8y9ysitl8	836	EUR	100	0	\N	t	2025-11-25 15:10:28.181	2025-11-25 15:10:28.181	\N
arhitj1mtydp002677h8pqfv	nrvc77uqaawbor31e1bx4c9a	vqjy4afrgy8o9p1m0ga4zpay	SKU-vqjy4afrgy8o9p1m0ga4zpay	836	EUR	100	0	\N	t	2025-11-25 15:10:28.859	2025-11-25 15:10:28.859	\N
plw58scpldp9it2p9o8m0d8d	nrvc77uqaawbor31e1bx4c9a	iaxv7vl8oemcr8qmugu03yua	SKU-iaxv7vl8oemcr8qmugu03yua	703	EUR	100	0	\N	t	2025-11-25 15:10:29.494	2025-11-25 15:10:29.494	\N
ik382ulbin902e2vqnssr2i9	nrvc77uqaawbor31e1bx4c9a	c1y30goz75epludiimg9mjnf	SKU-c1y30goz75epludiimg9mjnf	850	EUR	100	0	\N	t	2025-11-25 15:10:30.176	2025-11-25 15:10:30.176	\N
z6aga80u3gvuycylyfxqf6h0	nrvc77uqaawbor31e1bx4c9a	rvxmbtbhe6zeph09nr9yqg50	SKU-rvxmbtbhe6zeph09nr9yqg50	570	EUR	100	0	\N	t	2025-11-25 15:10:30.809	2025-11-25 15:10:30.809	\N
nup60400214qo67h5r2k5xz5	nrvc77uqaawbor31e1bx4c9a	d0wui8iccqhv9rkku4nkbxol	SKU-d0wui8iccqhv9rkku4nkbxol	584	EUR	100	0	\N	t	2025-11-25 15:10:31.509	2025-11-25 15:10:31.509	\N
s6i8zvua569dby2tzzozoatd	nrvc77uqaawbor31e1bx4c9a	rhxtuqxfk5xblm4vcwwlm6yr	SKU-rhxtuqxfk5xblm4vcwwlm6yr	673	EUR	100	0	\N	t	2025-11-25 15:10:32.143	2025-11-25 15:10:32.143	\N
mvo9cb443hjf9o1kfty02izy	nrvc77uqaawbor31e1bx4c9a	ocl5fkvh0ndg3m3ud9balytk	SKU-ocl5fkvh0ndg3m3ud9balytk	850	EUR	100	0	\N	t	2025-11-25 15:10:32.776	2025-11-25 15:10:32.776	\N
ew74ubuuechl83chxy6h3xec	nrvc77uqaawbor31e1bx4c9a	huunc7ed14zuc4wst947p4g3	SKU-huunc7ed14zuc4wst947p4g3	737	EUR	100	0	\N	t	2025-11-25 15:10:33.443	2025-11-25 15:10:33.443	\N
jeb5ejo0dhth0z38wpwi0xoz	nrvc77uqaawbor31e1bx4c9a	w1yv9d0de055p7bvbg2sdcai	SKU-w1yv9d0de055p7bvbg2sdcai	952	EUR	100	0	\N	t	2025-11-25 15:10:34.091	2025-11-25 15:10:34.091	\N
c31l0kijxjlic973gpqq1a1v	nrvc77uqaawbor31e1bx4c9a	ypvtqr1fmpm4zjchcsa2zbwj	SKU-ypvtqr1fmpm4zjchcsa2zbwj	2244	EUR	100	0	\N	t	2025-11-25 15:10:34.976	2025-11-25 15:10:34.976	\N
g03yv5f6ab5l6602dl4oylra	nrvc77uqaawbor31e1bx4c9a	c7iwv8on3xh4n4ffkvha7xrz	SKU-c7iwv8on3xh4n4ffkvha7xrz	6205	EUR	100	0	\N	t	2025-11-25 15:10:35.614	2025-11-25 15:10:35.614	\N
vgrxzleakzli4grxew25vhgd	nrvc77uqaawbor31e1bx4c9a	a9t2szoc8r3gn5xlgq898ruj	SKU-a9t2szoc8r3gn5xlgq898ruj	817	EUR	100	0	\N	t	2025-11-25 15:10:36.248	2025-11-25 15:10:36.248	\N
u7bz40kl1j53h13slms1gs0o	nrvc77uqaawbor31e1bx4c9a	yyxmrhwqmoqtnqoqxj4fiuaf	SKU-yyxmrhwqmoqtnqoqxj4fiuaf	817	EUR	100	0	\N	t	2025-11-25 15:10:36.889	2025-11-25 15:10:36.889	\N
p1n4fi7h576rbjd1bf3y0zbs	nrvc77uqaawbor31e1bx4c9a	lp1mwrjpv1yge8ln7bfe2t8h	SKU-lp1mwrjpv1yge8ln7bfe2t8h	180	EUR	100	0	\N	t	2025-11-25 15:10:37.533	2025-11-25 15:10:37.533	\N
xe2ukguavymnth3y3ebls875	nrvc77uqaawbor31e1bx4c9a	l8ynnj8zkrzdb78c4bzg6agg	SKU-l8ynnj8zkrzdb78c4bzg6agg	203	EUR	100	0	\N	t	2025-11-25 15:10:38.17	2025-11-25 15:10:38.17	\N
arti01612pjyaotl2k41my6j	nrvc77uqaawbor31e1bx4c9a	zjv90zlovciyy1oenjxfvb0r	SKU-zjv90zlovciyy1oenjxfvb0r	553	EUR	100	0	\N	t	2025-11-25 15:10:38.803	2025-11-25 15:10:38.803	\N
o7yiccx0jvfdkawbeyg4ofby	nrvc77uqaawbor31e1bx4c9a	poo7vk0xu55w30e79xixi0k8	SKU-poo7vk0xu55w30e79xixi0k8	772	EUR	100	0	\N	t	2025-11-25 15:10:39.453	2025-11-25 15:10:39.453	\N
ht78swtvxzyfg6rvmko5zb0a	nrvc77uqaawbor31e1bx4c9a	xepncjoaciebvp02s8qw3zjq	SKU-xepncjoaciebvp02s8qw3zjq	2040	EUR	100	0	\N	t	2025-11-25 15:10:40.185	2025-11-25 15:10:40.185	\N
p5inz1ghm7fx06iz83jzkof2	nrvc77uqaawbor31e1bx4c9a	p3ayod73mz35jwzm3hy0ruwz	SKU-p3ayod73mz35jwzm3hy0ruwz	1989	EUR	100	0	\N	t	2025-11-25 15:10:40.889	2025-11-25 15:10:40.889	\N
pe4dedvekw1qf05iulq7m9c6	nrvc77uqaawbor31e1bx4c9a	iyeyo6x0c2552iw3i0qubp5m	SKU-iyeyo6x0c2552iw3i0qubp5m	4590	EUR	100	0	\N	t	2025-11-25 15:10:41.526	2025-11-25 15:10:41.526	\N
hpymvqobg13yu1k10vun55uw	nrvc77uqaawbor31e1bx4c9a	g2zhsiycu4onnovwtirsjdzd	SKU-g2zhsiycu4onnovwtirsjdzd	1159	EUR	100	0	\N	t	2025-11-25 15:10:42.166	2025-11-25 15:10:42.166	\N
d8q68a1muwvzpe2nt557iwim	nrvc77uqaawbor31e1bx4c9a	h3qc2y74sjc22t8dydm9w1uz	SKU-h3qc2y74sjc22t8dydm9w1uz	2380	EUR	100	0	\N	t	2025-11-25 15:10:42.808	2025-11-25 15:10:42.808	\N
e387unw5qckm3epxen2us70d	nrvc77uqaawbor31e1bx4c9a	aiywc203qwf11pxkrzebky9g	SKU-aiywc203qwf11pxkrzebky9g	1828	EUR	100	0	\N	t	2025-11-25 15:10:43.442	2025-11-25 15:10:43.442	\N
p0nu8g6r6k42ky67pcz9gpti	nrvc77uqaawbor31e1bx4c9a	rg98r5ujnpg0wdqhsbhw11aa	SKU-rg98r5ujnpg0wdqhsbhw11aa	374	EUR	100	0	\N	t	2025-11-25 15:10:44.079	2025-11-25 15:10:44.079	\N
ifm1pn1c2d7wron6xzpivl7r	nrvc77uqaawbor31e1bx4c9a	ulsf1yve3vagpfgyvlkiv1r7	SKU-ulsf1yve3vagpfgyvlkiv1r7	340	EUR	100	0	\N	t	2025-11-25 15:10:44.718	2025-11-25 15:10:44.718	\N
c9y93d7n89f78vxsyophijk8	nrvc77uqaawbor31e1bx4c9a	bc6yu1rpzb4sdodkeia1ct1l	SKU-bc6yu1rpzb4sdodkeia1ct1l	4505	EUR	100	0	\N	t	2025-11-25 15:10:45.399	2025-11-25 15:10:45.399	\N
inrhcgony840q20m198b47w8	nrvc77uqaawbor31e1bx4c9a	gzouyq4wwzl8nxkt37jbc284	SKU-gzouyq4wwzl8nxkt37jbc284	6588	EUR	100	0	\N	t	2025-11-25 15:10:46.032	2025-11-25 15:10:46.032	\N
u9lbn1ma8fx8golmajlvpoi7	nrvc77uqaawbor31e1bx4c9a	fpkqci103s2c2sz12gj6f2lg	SKU-fpkqci103s2c2sz12gj6f2lg	1983	EUR	100	0	\N	t	2025-11-25 15:10:46.681	2025-11-25 15:10:46.681	\N
cwcbawn4t85lolubz57uu7wp	nrvc77uqaawbor31e1bx4c9a	r9wwot4b2okjkrm1xucbwazg	SKU-r9wwot4b2okjkrm1xucbwazg	4182	EUR	100	0	\N	t	2025-11-25 15:10:47.311	2025-11-25 15:10:47.311	\N
kc2r981jdg4qo2b9sn1zaaz2	nrvc77uqaawbor31e1bx4c9a	yul1tfnsrq0n1sfec7jeztg2	SKU-yul1tfnsrq0n1sfec7jeztg2	2054	EUR	100	0	\N	t	2025-11-25 15:10:47.949	2025-11-25 15:10:47.949	\N
ueej7x7ogt1btunymhjws8hn	nrvc77uqaawbor31e1bx4c9a	v2l77afxx73tbdbqfkrb9qwn	SKU-v2l77afxx73tbdbqfkrb9qwn	2685	EUR	100	0	\N	t	2025-11-25 15:10:48.582	2025-11-25 15:10:48.582	\N
i3p1xx2k1ltrcysl9riuxh1r	nrvc77uqaawbor31e1bx4c9a	lyywmejl7m1n9q8a800rrggr	SKU-lyywmejl7m1n9q8a800rrggr	2238	EUR	100	0	\N	t	2025-11-25 15:10:49.217	2025-11-25 15:10:49.217	\N
u15n4dq13wka4ag1zp5ray6u	nrvc77uqaawbor31e1bx4c9a	jpyklnbl23e4ueadcbfalg2p	SKU-jpyklnbl23e4ueadcbfalg2p	2224	EUR	100	0	\N	t	2025-11-25 15:10:49.851	2025-11-25 15:10:49.851	\N
rfi3b2ezy7o2j8or8b8kec5i	nrvc77uqaawbor31e1bx4c9a	pc7e8v8nxuilb3zvltfzkes4	SKU-pc7e8v8nxuilb3zvltfzkes4	1581	EUR	100	0	\N	t	2025-11-25 15:10:50.504	2025-11-25 15:10:50.504	\N
tni1hx0q5bdmc4rwe5yj6m5e	nrvc77uqaawbor31e1bx4c9a	pzep4uuy8tlrck9ufuveurqr	SKU-pzep4uuy8tlrck9ufuveurqr	2355	EUR	100	0	\N	t	2025-11-25 15:10:51.28	2025-11-25 15:10:51.28	\N
pyo6oxds2a6ehf7zze9rfxqv	nrvc77uqaawbor31e1bx4c9a	sqwtc0cf58yi9hv7iwm3uqi2	SKU-sqwtc0cf58yi9hv7iwm3uqi2	3596	EUR	100	0	\N	t	2025-11-25 15:10:52.079	2025-11-25 15:10:52.079	\N
lhlc0rtupla37bwizsxphpo0	nrvc77uqaawbor31e1bx4c9a	svbd3h48tuiewnp3pdlsn9rz	SKU-svbd3h48tuiewnp3pdlsn9rz	4131	EUR	100	0	\N	t	2025-11-25 15:10:52.836	2025-11-25 15:10:52.836	\N
sjbbslfxqtd9j3fb30184778	nrvc77uqaawbor31e1bx4c9a	d34l9l8zvyl32vcl7yqpg3lt	SKU-d34l9l8zvyl32vcl7yqpg3lt	4131	EUR	100	0	\N	t	2025-11-25 15:10:53.486	2025-11-25 15:10:53.486	\N
k7ajo2boa2rtp65xz6c2qqzh	nrvc77uqaawbor31e1bx4c9a	luo4hx512a0rk49ethvhyb2r	SKU-luo4hx512a0rk49ethvhyb2r	1785	EUR	100	0	\N	t	2025-11-25 15:10:54.182	2025-11-25 15:10:54.182	\N
r6cafb26eawo1cuoi297cm8w	nrvc77uqaawbor31e1bx4c9a	prets6n1rpgd382rcwo9ajpr	SKU-prets6n1rpgd382rcwo9ajpr	411	EUR	100	0	\N	t	2025-11-25 15:10:54.925	2025-11-25 15:10:54.925	\N
d17u2yg33j5ru3v8y5wgb9qf	nrvc77uqaawbor31e1bx4c9a	nnabas73pys2nyf9zhn1ithd	SKU-nnabas73pys2nyf9zhn1ithd	907	EUR	100	0	\N	t	2025-11-25 15:10:55.679	2025-11-25 15:10:55.679	\N
qmnh1bxw9214m0z4xakrhz0r	nrvc77uqaawbor31e1bx4c9a	n2iawhkksspwk3mh31oatou1	SKU-n2iawhkksspwk3mh31oatou1	907	EUR	100	0	\N	t	2025-11-25 15:10:56.365	2025-11-25 15:10:56.365	\N
vtb3rjs4l8z1hhcxd1j9vt18	nrvc77uqaawbor31e1bx4c9a	wru7f7f1fdxsfaqsoikvn8qn	SKU-wru7f7f1fdxsfaqsoikvn8qn	374	EUR	100	0	\N	t	2025-11-25 15:10:57.01	2025-11-25 15:10:57.01	\N
vp6tp0xrn9flpfqoqnls9vz1	nrvc77uqaawbor31e1bx4c9a	vbn1pgj78roiawffupgavnke	SKU-vbn1pgj78roiawffupgavnke	388	EUR	100	0	\N	t	2025-11-25 15:10:57.644	2025-11-25 15:10:57.644	\N
dvmd0h05xo3t4jg8kbqupabo	nrvc77uqaawbor31e1bx4c9a	ndc3kzvyy645mnz63b07cph3	SKU-ndc3kzvyy645mnz63b07cph3	3111	EUR	100	0	\N	t	2025-11-25 15:10:58.288	2025-11-25 15:10:58.288	\N
cdk7gu82tvub3umgkvtyyeoj	nrvc77uqaawbor31e1bx4c9a	a202cr17518drbbnqigrb8fi	SKU-a202cr17518drbbnqigrb8fi	1785	EUR	100	0	\N	t	2025-11-25 15:10:58.926	2025-11-25 15:10:58.926	\N
jvhzp3ast7qs7mvhqdkrdzln	nrvc77uqaawbor31e1bx4c9a	yftxypx07mxw8h9hiq1fatdg	SKU-yftxypx07mxw8h9hiq1fatdg	11560	EUR	100	0	\N	t	2025-11-25 15:10:59.58	2025-11-25 15:10:59.58	\N
glvv4p3wwkcbuv1ntq2biyj5	nrvc77uqaawbor31e1bx4c9a	la7b1tnlc08zsf0ok77o7g3l	SKU-la7b1tnlc08zsf0ok77o7g3l	12325	EUR	100	0	\N	t	2025-11-25 15:11:00.225	2025-11-25 15:11:00.225	\N
u3sl9kkiq1l7oquauet8sidm	nrvc77uqaawbor31e1bx4c9a	pa5cv44dpyu96bb0hvk7af2c	SKU-pa5cv44dpyu96bb0hvk7af2c	2278	EUR	100	0	\N	t	2025-11-25 15:11:00.862	2025-11-25 15:11:00.862	\N
dljuqclq7ax6yj8d8c1zeytq	nrvc77uqaawbor31e1bx4c9a	vd9z243f76kiu8obdi5yy7lh	SKU-vd9z243f76kiu8obdi5yy7lh	1757	EUR	100	0	\N	t	2025-11-25 15:11:01.518	2025-11-25 15:11:01.518	\N
re6nxjkgi2s22h95ux867lpz	nrvc77uqaawbor31e1bx4c9a	px0jxodf8k5e7s07ted81fei	SKU-px0jxodf8k5e7s07ted81fei	2040	EUR	100	0	\N	t	2025-11-25 15:11:02.16	2025-11-25 15:11:02.16	\N
o4lyvxo7x2p396zkzg02iik0	nrvc77uqaawbor31e1bx4c9a	rn9ublbzw5h589qxtl8ulxve	SKU-rn9ublbzw5h589qxtl8ulxve	2295	EUR	100	0	\N	t	2025-11-25 15:11:02.798	2025-11-25 15:11:02.798	\N
kc1xmqkcq633rqujl8ku8fe5	nrvc77uqaawbor31e1bx4c9a	s2fei6az7ns7jlfm1yvvjxux	SKU-s2fei6az7ns7jlfm1yvvjxux	1587	EUR	100	0	\N	t	2025-11-25 15:11:03.436	2025-11-25 15:11:03.436	\N
lhem82p3o4n0zivcyyhdafef	nrvc77uqaawbor31e1bx4c9a	zs4by4u1yiyd2h0ohhshtsso	SKU-zs4by4u1yiyd2h0ohhshtsso	524	EUR	100	0	\N	t	2025-11-25 15:11:04.075	2025-11-25 15:11:04.075	\N
ugphxfhxupxoczldc16nb3v5	nrvc77uqaawbor31e1bx4c9a	rj0zkb4qndu6s6c0xtshxjlt	SKU-rj0zkb4qndu6s6c0xtshxjlt	2763	EUR	100	0	\N	t	2025-11-25 15:11:04.708	2025-11-25 15:11:04.708	\N
imm2x8o59i5wo0pu52bynauk	nrvc77uqaawbor31e1bx4c9a	qiz6fo489skcbawkmi8ukv52	SKU-qiz6fo489skcbawkmi8ukv52	5313	EUR	100	0	\N	t	2025-11-25 15:11:05.343	2025-11-25 15:11:05.343	\N
eeoopqt3l8d85b42nw0bh2ja	nrvc77uqaawbor31e1bx4c9a	n609de558n4j1mg5dlic3egs	SKU-n609de558n4j1mg5dlic3egs	1148	EUR	100	0	\N	t	2025-11-25 15:11:06.056	2025-11-25 15:11:06.056	\N
enfxwjkoo0os99n7l2pyohj9	nrvc77uqaawbor31e1bx4c9a	vozmyb6ietm56hwlvpt0q95h	SKU-vozmyb6ietm56hwlvpt0q95h	3400	EUR	100	0	\N	t	2025-11-25 15:11:06.694	2025-11-25 15:11:06.694	\N
soh4g03skmbx0fagpuq15ocx	nrvc77uqaawbor31e1bx4c9a	tz8ymrvrag5zkmwbtf39zxxk	SKU-tz8ymrvrag5zkmwbtf39zxxk	2295	EUR	100	0	\N	t	2025-11-25 15:11:07.363	2025-11-25 15:11:07.363	\N
m4l5qo91g3am4sy0c7q5uyma	nrvc77uqaawbor31e1bx4c9a	j96lljhg7rqmw0kw05p0l3ei	SKU-j96lljhg7rqmw0kw05p0l3ei	6035	EUR	100	0	\N	t	2025-11-25 15:11:08.001	2025-11-25 15:11:08.001	\N
o2veo70peqlidm70s9eh8wsk	nrvc77uqaawbor31e1bx4c9a	brql7mranm27td4fpmlizy6p	SKU-brql7mranm27td4fpmlizy6p	3162	EUR	100	0	\N	t	2025-11-25 15:11:08.636	2025-11-25 15:11:08.636	\N
amv53jzihl0ce1b1kfw9z9fl	nrvc77uqaawbor31e1bx4c9a	jiwpscsdoo9opja5u4b5sxk6	SKU-jiwpscsdoo9opja5u4b5sxk6	1360	EUR	100	0	\N	t	2025-11-25 15:11:09.273	2025-11-25 15:11:09.273	\N
cxdkxmhuca3yfu53t1k9163e	yhoxsn248ihovbv0i7flt0le	mjmbt16amb7jhzc74se99dt9	SKU-mjmbt16amb7jhzc74se99dt9	17	EUR	100	0	\N	t	2025-11-25 15:11:10.342	2025-11-25 15:11:10.342	\N
yqvuqezqwf0714qenr3rmbcs	yhoxsn248ihovbv0i7flt0le	yxsv8n9m72cse9xwsg7m96b3	SKU-yxsv8n9m72cse9xwsg7m96b3	5	EUR	100	0	\N	t	2025-11-25 15:11:10.978	2025-11-25 15:11:10.978	\N
ncpwnkb8r5xmwtmefb6c489p	yhoxsn248ihovbv0i7flt0le	rvr7xsamnywmxg4k603cpo8c	SKU-rvr7xsamnywmxg4k603cpo8c	289	EUR	100	0	\N	t	2025-11-25 15:11:11.64	2025-11-25 15:11:11.64	\N
xeg60dfh77o2tz68ht89rwvd	yhoxsn248ihovbv0i7flt0le	pczhqs6k91rz4oas9nqhzir3	SKU-pczhqs6k91rz4oas9nqhzir3	290	EUR	100	0	\N	t	2025-11-25 15:11:12.276	2025-11-25 15:11:12.838	\N
ec98elz7qcfngd5sc238v89x	yhoxsn248ihovbv0i7flt0le	camrcp8fjqz6ok9pzdqvw2l4	SKU-camrcp8fjqz6ok9pzdqvw2l4	130	EUR	100	0	\N	t	2025-11-25 15:11:13.474	2025-11-25 15:11:13.474	\N
vkl383n3u3ewlfi0x43df4mf	yhoxsn248ihovbv0i7flt0le	bcffslfdg3mtucqzpv4lg761	SKU-bcffslfdg3mtucqzpv4lg761	490	EUR	100	0	\N	t	2025-11-25 15:11:14.107	2025-11-25 15:11:14.107	\N
fc2wm6o9omcfvxc93e794k1n	yhoxsn248ihovbv0i7flt0le	rob279t3fh2xtihbsdk2mn6j	SKU-rob279t3fh2xtihbsdk2mn6j	135	EUR	100	0	\N	t	2025-11-25 15:11:14.742	2025-11-25 15:11:14.742	\N
t7af18lbyy0wvn9izd8m0ut5	v7ke5gm3d70tn157b0vvxlvg	ete33zbtn00k0nuh28qlkvxg	SKU-ete33zbtn00k0nuh28qlkvxg	2950	EUR	100	0	\N	t	2025-11-25 15:11:15.522	2025-11-25 15:11:15.522	\N
yhbas11pqi5htg1qxcjda7qb	v7ke5gm3d70tn157b0vvxlvg	qnsyu5pnlthuhdgoyw9wg39q	SKU-qnsyu5pnlthuhdgoyw9wg39q	1735	EUR	100	0	\N	t	2025-11-25 15:11:17.445	2025-11-25 15:11:17.445	\N
srk7o1uy1gvxxndfkn0ka9zv	v7ke5gm3d70tn157b0vvxlvg	bkj74pzr6hldpcjwn7d6ivkx	SKU-bkj74pzr6hldpcjwn7d6ivkx	1465	EUR	100	0	\N	t	2025-11-25 15:11:18.086	2025-11-25 15:11:18.086	\N
z3hxcklqbenmwxrlloskra4x	ymkw92mnbxxlwruo6rr2yyc1	cbkec478m8a9ax21n9bo4x8r	SKU-cbkec478m8a9ax21n9bo4x8r	790	EUR	100	0	\N	t	2025-11-25 14:52:55.375	2025-11-25 14:52:55.375	\N
bzipd2j731jsom6bm2zfar2h	ymkw92mnbxxlwruo6rr2yyc1	rwh3kuw00b7sgzxck63z55m6	SKU-rwh3kuw00b7sgzxck63z55m6	840	EUR	100	0	\N	t	2025-11-25 14:52:56.168	2025-11-25 14:52:56.168	\N
s8fmp0rbupjj73wsibotn74b	ymkw92mnbxxlwruo6rr2yyc1	oygxgvy8jjraivszgcp8n02q	SKU-oygxgvy8jjraivszgcp8n02q	960	EUR	100	0	\N	t	2025-11-25 14:52:56.832	2025-11-25 14:52:56.832	\N
ipzq3j97emcpt68y3bzfd7wt	ymkw92mnbxxlwruo6rr2yyc1	p40458u8vpy2x1erjap80zij	SKU-p40458u8vpy2x1erjap80zij	1130	EUR	100	0	\N	t	2025-11-25 14:52:57.463	2025-11-25 14:52:57.463	\N
av8ab4lppzitz6y5t4lqjmnb	ymkw92mnbxxlwruo6rr2yyc1	dxpdq25d9r68igouefzq66ly	SKU-dxpdq25d9r68igouefzq66ly	1300	EUR	100	0	\N	t	2025-11-25 14:52:58.092	2025-11-25 14:52:58.092	\N
wgs33ntqlrmgw3377d2ed11h	ymkw92mnbxxlwruo6rr2yyc1	u6pczrt7t9fag3x7eu9nqm22	SKU-u6pczrt7t9fag3x7eu9nqm22	1450	EUR	100	0	\N	t	2025-11-25 14:52:58.726	2025-11-25 14:52:58.726	\N
zkn30w28z84lfg3ugdhr1lp6	ymkw92mnbxxlwruo6rr2yyc1	iq89ik8uqrg2oy9r7ajgqzv4	SKU-iq89ik8uqrg2oy9r7ajgqzv4	16	EUR	100	0	\N	t	2025-11-25 14:52:59.36	2025-11-25 14:52:59.36	\N
b2uaz09c9dn6xmtc5s75secd	ymkw92mnbxxlwruo6rr2yyc1	ubi16i54llkzz613ja6n1ngw	SKU-ubi16i54llkzz613ja6n1ngw	2450	EUR	100	0	\N	t	2025-11-25 14:52:59.994	2025-11-25 14:52:59.994	\N
c9fabgxmycvp42cppntgpbvh	ymkw92mnbxxlwruo6rr2yyc1	hdo6p8npzppq2kuiuel1rzh1	SKU-hdo6p8npzppq2kuiuel1rzh1	840	EUR	100	0	\N	t	2025-11-25 14:53:00.636	2025-11-25 14:53:00.636	\N
dt95a3iigcdexumoqfhm06l2	ymkw92mnbxxlwruo6rr2yyc1	ptn1dz2iv91l3ismd4owxxpj	SKU-ptn1dz2iv91l3ismd4owxxpj	860	EUR	100	0	\N	t	2025-11-25 14:53:01.281	2025-11-25 14:53:01.281	\N
lf8lgmyrzhju3bc2842z4lrg	ymkw92mnbxxlwruo6rr2yyc1	hxuflqlay5fquw40cqqlgzyt	SKU-hxuflqlay5fquw40cqqlgzyt	1020	EUR	100	0	\N	t	2025-11-25 14:53:01.913	2025-11-25 14:53:01.913	\N
q17vdjytlyipxoduv5ips8rl	ymkw92mnbxxlwruo6rr2yyc1	m0g7jludxzwohu12r1k26yao	SKU-m0g7jludxzwohu12r1k26yao	1140	EUR	100	0	\N	t	2025-11-25 14:53:02.545	2025-11-25 14:53:02.545	\N
uryehunwjpdp6w9cnvfb2reb	ymkw92mnbxxlwruo6rr2yyc1	efbgv2b3bqib8fcnf9tv87t5	SKU-efbgv2b3bqib8fcnf9tv87t5	1290	EUR	100	0	\N	t	2025-11-25 14:53:03.177	2025-11-25 14:53:03.177	\N
e4x9zwe8e2cpgpy575ew3acq	v7ke5gm3d70tn157b0vvxlvg	o5hppt93oeza927kaq2ufp62	SKU-o5hppt93oeza927kaq2ufp62	1570	EUR	100	0	\N	f	2025-11-25 15:11:16.799	2025-11-26 10:47:11.193	\N
tylyotc6v76k264w7bal0lhx	v7ke5gm3d70tn157b0vvxlvg	haq4ahc7mcu2iwnr1f0y8ovm	SKU-haq4ahc7mcu2iwnr1f0y8ovm	2000	EUR	120	0	\N	t	2025-11-25 15:11:16.164	2025-12-01 20:19:23.264	\N
ju668ij01dzhofs2a8hclwy5	ymkw92mnbxxlwruo6rr2yyc1	gikg2wwuy6bs4eihnb0wr8j5	SKU-gikg2wwuy6bs4eihnb0wr8j5	1440	EUR	100	0	\N	t	2025-11-25 14:53:03.819	2025-11-25 14:53:03.819	\N
ac9nmmigttbkze473fa4g12u	ymkw92mnbxxlwruo6rr2yyc1	zl8pphfg9ik1ast0ienyoj9h	SKU-zl8pphfg9ik1ast0ienyoj9h	1580	EUR	100	0	\N	t	2025-11-25 14:53:04.456	2025-11-25 14:53:04.456	\N
bnqrjsvr97xnd6nkzy6hlrr2	ymkw92mnbxxlwruo6rr2yyc1	f4gpi00emfws5up9ncscql3v	SKU-f4gpi00emfws5up9ncscql3v	1290	EUR	100	0	\N	t	2025-11-25 14:53:05.097	2025-11-25 14:53:05.097	\N
qi0aqevwc8co35c1opg6v3eh	v7ke5gm3d70tn157b0vvxlvg	qnq076hmduw8l0rnf5aej8i7	SKU-qnq076hmduw8l0rnf5aej8i7	1895	EUR	100	0	\N	t	2025-11-25 15:11:18.719	2025-11-25 15:11:18.719	\N
o43gky5cu6hat81avsy4ii27	v7ke5gm3d70tn157b0vvxlvg	f301ydialjrp4p3sa36e2srq	SKU-f301ydialjrp4p3sa36e2srq	1525	EUR	100	0	\N	t	2025-11-25 15:11:19.355	2025-11-25 15:11:19.355	\N
xfbkp6umiuuk1p7vmmagavax	v7ke5gm3d70tn157b0vvxlvg	ad7ke7bpru2we2i41qzzf51l	SKU-ad7ke7bpru2we2i41qzzf51l	1525	EUR	100	0	\N	t	2025-11-25 15:11:19.989	2025-11-25 15:11:19.989	\N
evsirkwobo5ehjpjl4ejkbwx	v7ke5gm3d70tn157b0vvxlvg	ovqqlfr4xwiqvft7dyapwfsq	SKU-ovqqlfr4xwiqvft7dyapwfsq	1565	EUR	100	0	\N	t	2025-11-25 15:11:20.624	2025-11-25 15:11:20.624	\N
pq39yqyp1tpyp6ur6sqsl7sg	v7ke5gm3d70tn157b0vvxlvg	m1z0og2ydzb2652ul90krr6s	SKU-m1z0og2ydzb2652ul90krr6s	1525	EUR	100	0	\N	t	2025-11-25 15:11:21.261	2025-11-25 15:11:21.261	\N
nddyt4d8z4pcumhbdic38sd8	v7ke5gm3d70tn157b0vvxlvg	takgr4nf1w4g263ybc9h59s6	SKU-takgr4nf1w4g263ybc9h59s6	1525	EUR	100	0	\N	t	2025-11-25 15:11:21.896	2025-11-25 15:11:21.896	\N
jssrokyxka8jae7188x5e6hc	v7ke5gm3d70tn157b0vvxlvg	jup8pqtmrbs5yuw63iayb6we	SKU-jup8pqtmrbs5yuw63iayb6we	1570	EUR	100	0	\N	t	2025-11-25 15:11:22.527	2025-11-25 15:11:22.527	\N
nnfray42gxdgl319eczxtq35	v7ke5gm3d70tn157b0vvxlvg	khm1yqv42d57ee6k7z972x88	SKU-khm1yqv42d57ee6k7z972x88	1735	EUR	100	0	\N	t	2025-11-25 15:11:23.161	2025-11-25 15:11:23.161	\N
oe2wrs2aai96tu1sfm721ajc	v7ke5gm3d70tn157b0vvxlvg	p16h4d3i5zzq55qs4jh8su7d	SKU-p16h4d3i5zzq55qs4jh8su7d	1889	EUR	100	0	\N	t	2025-11-25 15:11:23.794	2025-11-25 15:11:23.794	\N
luprfv4gyg9do3vto5j45wmh	v7ke5gm3d70tn157b0vvxlvg	ccd66n6n25y1ejfzdnp3hkd1	SKU-ccd66n6n25y1ejfzdnp3hkd1	1889	EUR	100	0	\N	t	2025-11-25 15:11:24.445	2025-11-25 15:11:24.445	\N
lkp4cpscse1excj9w2jm4yy7	v7ke5gm3d70tn157b0vvxlvg	p23bx4fk76i3oqqrhepk5svb	SKU-p23bx4fk76i3oqqrhepk5svb	1550	EUR	100	0	\N	t	2025-11-25 15:11:25.075	2025-11-25 15:11:25.075	\N
\.


--
-- Data for Name: VerificationToken; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."VerificationToken" (identifier, token, expires) FROM stdin;
rigelsrls2020@gmail.com	aab11d00d3bf0020d58d4bb0ff23f3af423db1efc2a54df4b127414e01c11e0d	2025-12-08 15:00:53.033
andreaelsayed85@gmail.com	876a6dd83c042ea4bfdcc0313d3b10ab10c839dce2aff45c066e0cc0c99fbd0c	2025-12-08 21:12:53.163
client.demo@hydra.local	166740c9d6cd71b0992fb70ed99072f992d885b5a32108482715c8e797e5967d	2025-12-08 23:03:45.643
vendor.freezco@hydra.local	a1dd7417c8efc9a6af9758bffaeb1d9c39f978df59ca8de7418f6065fa6b93c9	2025-11-27 10:42:57.558
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
e2a3ee88-df3c-4c79-bd89-0999938f02c9	91f67782cf680399c2390a77c0774644d3269d6b7fb7ba5c0b92d1e55e7c5601	2025-11-19 18:59:50.625872+00	20251110065525_initial_schema	\N	\N	2025-11-19 18:59:49.986999+00	1
c651ba3c-9fb1-43c6-b984-c10a6e0678cf	b8edc581c9eaabd5fa068e5cc2777ad13b1dd70e16e85290a992763cafcb6fc2	2025-11-19 18:59:50.953348+00	20251110072503_add_email_verified	\N	\N	2025-11-19 18:59:50.72129+00	1
8d15d3db-3520-4e7b-9f39-3cd25e804086	1896d46bd8a30834a6638cb80a42de8f73781e2019f4fed20225e46911ec886b	2025-11-19 18:59:51.27787+00	20251111133707_catalog_pagination_indexes	\N	\N	2025-11-19 18:59:51.045416+00	1
cb425ff1-e61c-4c33-92ac-65a86fa7112b	e0fd0a75492c7b1a8a6c8d33d4bd3118371a9564c945c403906c60c3a7ee9ca8	2025-11-19 18:59:51.610307+00	20251114210000_add_order_number	\N	\N	2025-11-19 18:59:51.370143+00	1
2cae2a6f-5f30-4409-a00f-1a70b6f59a9f	194deee30df471f12728fd8b2752d514ee64e525423ddb26cafa7edb0b158266	2025-11-19 18:59:51.954772+00	20251117165409_add_driver_role_and_delivery	\N	\N	2025-11-19 18:59:51.701876+00	1
fb172824-6a11-4343-b5ca-530cc5576f11	d6c943640741db1ac2e4f0b05b3dbd226cc53ffc4ed2c18aa96a66133da7d3b9	2025-11-19 18:59:52.293783+00	20251118193116_add_driver_shifts	\N	\N	2025-11-19 18:59:52.0456+00	1
b5a5a7cf-8c2c-4a05-b684-e253be4513ec	4596b3c7bde54417595d3ff7c1b71bfacc794c7cb7f42fea973a06162c706d69	2025-11-19 19:01:43.012736+00	20251119190142_add_client_address_fields	\N	\N	2025-11-19 19:01:42.772313+00	1
e624bb34-757f-432c-96fd-3398d73157a7	f71b6ab11172e415a93f6cca8861d87e942ec5db633b30179516d882b26e1f72	2025-11-21 13:58:18.341764+00	20251121135805_add_vendor_contact_fields	\N	\N	2025-11-21 13:58:18.19013+00	1
\.


--
-- Data for Name: playing_with_neon; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.playing_with_neon (id, name, value) FROM stdin;
1	c4ca4238a0	0.31006873
2	c81e728d9d	0.5259577
3	eccbc87e4b	0.62122333
4	a87ff679a2	0.42370272
5	e4da3b7fbb	0.6117795
6	1679091c5a	0.0569654
7	8f14e45fce	0.08911313
8	c9f0f895fb	0.11197767
9	45c48cce2e	0.2521111
10	d3d9446802	0.9846522
11	c4ca4238a0	0.9181321
12	c81e728d9d	0.8018969
13	eccbc87e4b	0.7045532
14	a87ff679a2	0.312793
15	e4da3b7fbb	0.32185844
16	1679091c5a	0.4599955
17	8f14e45fce	0.5248437
18	c9f0f895fb	0.80577725
19	45c48cce2e	0.9202301
20	d3d9446802	0.31812063
\.


--
-- Name: playing_with_neon_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.playing_with_neon_id_seq', 20, true);


--
-- Name: Account Account_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_pkey" PRIMARY KEY (id);


--
-- Name: AgentClient AgentClient_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."AgentClient"
    ADD CONSTRAINT "AgentClient_pkey" PRIMARY KEY ("userId", "clientId");


--
-- Name: AgentVendor AgentVendor_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."AgentVendor"
    ADD CONSTRAINT "AgentVendor_pkey" PRIMARY KEY ("userId", "vendorId");


--
-- Name: Agreement Agreement_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Agreement"
    ADD CONSTRAINT "Agreement_pkey" PRIMARY KEY (id);


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: CartItem CartItem_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."CartItem"
    ADD CONSTRAINT "CartItem_pkey" PRIMARY KEY (id);


--
-- Name: Cart Cart_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Cart"
    ADD CONSTRAINT "Cart_pkey" PRIMARY KEY (id);


--
-- Name: CategoryGroup CategoryGroup_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."CategoryGroup"
    ADD CONSTRAINT "CategoryGroup_pkey" PRIMARY KEY (id);


--
-- Name: Client Client_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Client"
    ADD CONSTRAINT "Client_pkey" PRIMARY KEY (id);


--
-- Name: Delivery Delivery_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Delivery"
    ADD CONSTRAINT "Delivery_pkey" PRIMARY KEY (id);


--
-- Name: DriverShift DriverShift_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."DriverShift"
    ADD CONSTRAINT "DriverShift_pkey" PRIMARY KEY (id);


--
-- Name: DriverStop DriverStop_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."DriverStop"
    ADD CONSTRAINT "DriverStop_pkey" PRIMARY KEY (id);


--
-- Name: Driver Driver_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Driver"
    ADD CONSTRAINT "Driver_pkey" PRIMARY KEY (id);


--
-- Name: OrderItem OrderItem_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_pkey" PRIMARY KEY (id);


--
-- Name: Order Order_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_pkey" PRIMARY KEY (id);


--
-- Name: ProductCategory ProductCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ProductCategory"
    ADD CONSTRAINT "ProductCategory_pkey" PRIMARY KEY (id);


--
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Vehicle Vehicle_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Vehicle"
    ADD CONSTRAINT "Vehicle_pkey" PRIMARY KEY (id);


--
-- Name: VendorProduct VendorProduct_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."VendorProduct"
    ADD CONSTRAINT "VendorProduct_pkey" PRIMARY KEY (id);


--
-- Name: Vendor Vendor_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Vendor"
    ADD CONSTRAINT "Vendor_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: playing_with_neon playing_with_neon_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.playing_with_neon
    ADD CONSTRAINT playing_with_neon_pkey PRIMARY KEY (id);


--
-- Name: Account_provider_providerAccountId_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON public."Account" USING btree (provider, "providerAccountId");


--
-- Name: Account_userId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Account_userId_idx" ON public."Account" USING btree ("userId");


--
-- Name: AgentClient_clientId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "AgentClient_clientId_idx" ON public."AgentClient" USING btree ("clientId");


--
-- Name: AgentClient_userId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "AgentClient_userId_idx" ON public."AgentClient" USING btree ("userId");


--
-- Name: AgentVendor_userId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "AgentVendor_userId_idx" ON public."AgentVendor" USING btree ("userId");


--
-- Name: AgentVendor_vendorId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "AgentVendor_vendorId_idx" ON public."AgentVendor" USING btree ("vendorId");


--
-- Name: Agreement_clientId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Agreement_clientId_idx" ON public."Agreement" USING btree ("clientId");


--
-- Name: Agreement_clientId_vendorId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Agreement_clientId_vendorId_idx" ON public."Agreement" USING btree ("clientId", "vendorId");


--
-- Name: Agreement_vendorId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Agreement_vendorId_idx" ON public."Agreement" USING btree ("vendorId");


--
-- Name: AuditLog_actorUserId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "AuditLog_actorUserId_idx" ON public."AuditLog" USING btree ("actorUserId");


--
-- Name: AuditLog_createdAt_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "AuditLog_createdAt_idx" ON public."AuditLog" USING btree ("createdAt");


--
-- Name: AuditLog_entityType_entityId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "AuditLog_entityType_entityId_idx" ON public."AuditLog" USING btree ("entityType", "entityId");


--
-- Name: CartItem_cartId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "CartItem_cartId_idx" ON public."CartItem" USING btree ("cartId");


--
-- Name: CartItem_vendorProductId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "CartItem_vendorProductId_idx" ON public."CartItem" USING btree ("vendorProductId");


--
-- Name: Cart_clientId_status_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Cart_clientId_status_idx" ON public."Cart" USING btree ("clientId", status);


--
-- Name: CategoryGroup_name_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "CategoryGroup_name_key" ON public."CategoryGroup" USING btree (name);


--
-- Name: Client_region_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Client_region_idx" ON public."Client" USING btree (region);


--
-- Name: Delivery_assignedAt_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Delivery_assignedAt_idx" ON public."Delivery" USING btree ("assignedAt");


--
-- Name: Delivery_driverId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Delivery_driverId_idx" ON public."Delivery" USING btree ("driverId");


--
-- Name: Delivery_driverId_routeSequence_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Delivery_driverId_routeSequence_idx" ON public."Delivery" USING btree ("driverId", "routeSequence");


--
-- Name: Delivery_orderId_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Delivery_orderId_key" ON public."Delivery" USING btree ("orderId");


--
-- Name: Delivery_status_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Delivery_status_idx" ON public."Delivery" USING btree (status);


--
-- Name: DriverShift_date_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "DriverShift_date_idx" ON public."DriverShift" USING btree (date);


--
-- Name: DriverShift_driverId_date_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "DriverShift_driverId_date_idx" ON public."DriverShift" USING btree ("driverId", date);


--
-- Name: DriverShift_driverId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "DriverShift_driverId_idx" ON public."DriverShift" USING btree ("driverId");


--
-- Name: DriverShift_vehicleId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "DriverShift_vehicleId_idx" ON public."DriverShift" USING btree ("vehicleId");


--
-- Name: DriverStop_clientId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "DriverStop_clientId_idx" ON public."DriverStop" USING btree ("clientId");


--
-- Name: DriverStop_shiftId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "DriverStop_shiftId_idx" ON public."DriverStop" USING btree ("shiftId");


--
-- Name: DriverStop_shiftId_sequenceNumber_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "DriverStop_shiftId_sequenceNumber_idx" ON public."DriverStop" USING btree ("shiftId", "sequenceNumber");


--
-- Name: Driver_status_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Driver_status_idx" ON public."Driver" USING btree (status);


--
-- Name: OrderItem_orderId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "OrderItem_orderId_idx" ON public."OrderItem" USING btree ("orderId");


--
-- Name: OrderItem_vendorProductId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "OrderItem_vendorProductId_idx" ON public."OrderItem" USING btree ("vendorProductId");


--
-- Name: Order_assignedAgentUserId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Order_assignedAgentUserId_idx" ON public."Order" USING btree ("assignedAgentUserId");


--
-- Name: Order_clientId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Order_clientId_idx" ON public."Order" USING btree ("clientId");


--
-- Name: Order_orderNumber_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Order_orderNumber_key" ON public."Order" USING btree ("orderNumber");


--
-- Name: Order_status_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Order_status_idx" ON public."Order" USING btree (status);


--
-- Name: ProductCategory_groupId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "ProductCategory_groupId_idx" ON public."ProductCategory" USING btree ("groupId");


--
-- Name: ProductCategory_slug_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "ProductCategory_slug_key" ON public."ProductCategory" USING btree (slug);


--
-- Name: Product_categoryId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Product_categoryId_idx" ON public."Product" USING btree ("categoryId");


--
-- Name: Product_name_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Product_name_idx" ON public."Product" USING btree (name);


--
-- Name: Session_sessionToken_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Session_sessionToken_key" ON public."Session" USING btree ("sessionToken");


--
-- Name: Session_userId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Session_userId_idx" ON public."Session" USING btree ("userId");


--
-- Name: User_agentCode_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "User_agentCode_key" ON public."User" USING btree ("agentCode");


--
-- Name: User_clientId_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "User_clientId_key" ON public."User" USING btree ("clientId");


--
-- Name: User_driverId_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "User_driverId_key" ON public."User" USING btree ("driverId");


--
-- Name: User_email_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "User_email_idx" ON public."User" USING btree (email);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_role_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "User_role_idx" ON public."User" USING btree (role);


--
-- Name: User_vendorId_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "User_vendorId_key" ON public."User" USING btree ("vendorId");


--
-- Name: Vehicle_licensePlate_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Vehicle_licensePlate_key" ON public."Vehicle" USING btree ("licensePlate");


--
-- Name: VendorProduct_isActive_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "VendorProduct_isActive_idx" ON public."VendorProduct" USING btree ("isActive");


--
-- Name: VendorProduct_productId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "VendorProduct_productId_idx" ON public."VendorProduct" USING btree ("productId");


--
-- Name: VendorProduct_stockQty_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "VendorProduct_stockQty_idx" ON public."VendorProduct" USING btree ("stockQty");


--
-- Name: VendorProduct_vendorId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "VendorProduct_vendorId_idx" ON public."VendorProduct" USING btree ("vendorId");


--
-- Name: VendorProduct_vendorId_productId_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "VendorProduct_vendorId_productId_key" ON public."VendorProduct" USING btree ("vendorId", "productId");


--
-- Name: Vendor_region_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Vendor_region_idx" ON public."Vendor" USING btree (region);


--
-- Name: VerificationToken_identifier_token_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON public."VerificationToken" USING btree (identifier, token);


--
-- Name: VerificationToken_token_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "VerificationToken_token_key" ON public."VerificationToken" USING btree (token);


--
-- Name: Account Account_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AgentClient AgentClient_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."AgentClient"
    ADD CONSTRAINT "AgentClient_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public."Client"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AgentClient AgentClient_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."AgentClient"
    ADD CONSTRAINT "AgentClient_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AgentVendor AgentVendor_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."AgentVendor"
    ADD CONSTRAINT "AgentVendor_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AgentVendor AgentVendor_vendorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."AgentVendor"
    ADD CONSTRAINT "AgentVendor_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES public."Vendor"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Agreement Agreement_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Agreement"
    ADD CONSTRAINT "Agreement_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public."Client"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Agreement Agreement_vendorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Agreement"
    ADD CONSTRAINT "Agreement_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES public."Vendor"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AuditLog AuditLog_actorUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CartItem CartItem_cartId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."CartItem"
    ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES public."Cart"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CartItem CartItem_vendorProductId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."CartItem"
    ADD CONSTRAINT "CartItem_vendorProductId_fkey" FOREIGN KEY ("vendorProductId") REFERENCES public."VendorProduct"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Cart Cart_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Cart"
    ADD CONSTRAINT "Cart_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public."Client"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Cart Cart_createdByUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Cart"
    ADD CONSTRAINT "Cart_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Delivery Delivery_driverId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Delivery"
    ADD CONSTRAINT "Delivery_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES public."Driver"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Delivery Delivery_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Delivery"
    ADD CONSTRAINT "Delivery_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DriverShift DriverShift_driverId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."DriverShift"
    ADD CONSTRAINT "DriverShift_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES public."Driver"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DriverShift DriverShift_vehicleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."DriverShift"
    ADD CONSTRAINT "DriverShift_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES public."Vehicle"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DriverStop DriverStop_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."DriverStop"
    ADD CONSTRAINT "DriverStop_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public."Client"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DriverStop DriverStop_shiftId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."DriverStop"
    ADD CONSTRAINT "DriverStop_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES public."DriverShift"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrderItem OrderItem_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrderItem OrderItem_vendorProductId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_vendorProductId_fkey" FOREIGN KEY ("vendorProductId") REFERENCES public."VendorProduct"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Order Order_assignedAgentUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_assignedAgentUserId_fkey" FOREIGN KEY ("assignedAgentUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Order Order_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public."Client"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Order Order_submitterUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_submitterUserId_fkey" FOREIGN KEY ("submitterUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ProductCategory ProductCategory_groupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ProductCategory"
    ADD CONSTRAINT "ProductCategory_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES public."CategoryGroup"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Product Product_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."ProductCategory"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Session Session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: User User_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public."Client"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: User User_driverId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES public."Driver"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: User User_vendorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES public."Vendor"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: VendorProduct VendorProduct_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."VendorProduct"
    ADD CONSTRAINT "VendorProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: VendorProduct VendorProduct_vendorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."VendorProduct"
    ADD CONSTRAINT "VendorProduct_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES public."Vendor"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: neondb_owner
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

