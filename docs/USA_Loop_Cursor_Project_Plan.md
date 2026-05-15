# USA Loop Trip App — Cursor Project Plan

## Project Purpose

Build and organize a complete trip-planning web application for a 36-day motorcycle loop:

**Toronto → Texas → West Coast → Rockies → Toronto**

The app should help manage:

- Daily route plan
- Weather checkpoints
- Motorcycle maintenance
- Packing
- Hosts and sleeping locations
- Content creation plan
- Emergency information
- Budget tracking
- Useful links and resources

The trip is based on a Suzuki DR650 ride from **May 20, 2026 to June 24, 2026**, covering approximately **14,400 km** over **36 days**.

---

# 1. Recommended App Flow

The app should be organized into these main sections:

1. Dashboard
2. Route Overview
3. Daily Plan
4. Weather
5. Hosts & Sleep
6. Motorcycle Maintenance
7. Packing
8. Budget
9. Content Plan
10. Emergency
11. Documents
12. Notes

This structure keeps the trip productive and easy to follow during the ride.

---

# 2. Dashboard Page

## Goal

Give the rider a quick overview of the whole trip.

## Show These Cards

- Trip name: USA Loop 2026
- Bike: Suzuki DR650
- Total days: 36
- Total distance: 14,400 km
- Current day
- Today’s route
- Today’s weather
- Today’s sleep location
- Next maintenance reminder
- Important warning, if any

## Dashboard Logic

The app should automatically detect the current date and match it to the correct trip day.

Example:

```js
const tripStartDate = new Date('2026-05-20')
const today = new Date()
const currentDay = Math.floor((today - tripStartDate) / (1000 * 60 * 60 * 24)) + 1
```

If the current day is outside the trip range, show:

- Before trip: “Trip has not started yet”
- After trip: “Trip completed”

---

# 3. Route Overview Page

## Goal

Show the full route in three clear legs.

## Route Legs

### Leg 1: Toronto to Fort Worth

**Days:** 1–9  
**Purpose:** Border crossing, East Coast, Appalachians, Smokies, Texas home stop.

### Leg 2: Fort Worth to Seattle

**Days:** 10–24  
**Purpose:** Southwest, Utah, California coast, Oregon, Seattle.

### Leg 3: Seattle to Toronto

**Days:** 25–36  
**Purpose:** North Cascades, Yellowstone, Beartooth Highway, Great Lakes return.

## Route Features

- Show route pins by day
- Use different colors for each leg
- Show total km
- Show daily km
- Add Google Maps direction links for each day

---

# 4. Daily Plan Page

## Goal

This is the most important page. It should guide the rider every day.

## Daily Card Fields

Each day should include:

- Day number
- Date
- Leg number
- From location
- To location
- Distance
- Estimated riding time
- Route type
- Highlight
- Sleep location
- Google Maps link
- Weather link
- Notes
- Risk level
- Content idea
- Bike check reminder

## Example Daily Object

```js
const day = {
  day: 1,
  date: '2026-05-20',
  leg: 1,
  from: 'Toronto, ON',
  to: 'Horseheads, NY',
  distanceKm: 388.8,
  rideTime: '4 h 9 min',
  routeType: 'Highway / border crossing',
  highlight: 'US entry documentation ready',
  sleep: 'Jimmy & Kaylee Comfort',
  riskLevel: 'Medium',
  contentIdea: 'Trip start, border crossing, first day emotions',
  bikeCheck: ['Tire pressure', 'Oil level', 'Chain', 'Luggage bolts']
}
```

## Daily Page Layout

For each day show:

1. Route summary
2. Weather summary
3. Sleep location
4. Risk warnings
5. Content plan
6. Bike checks
7. Notes section

---

# 5. Weather Page

## Goal

Help the rider avoid dangerous weather.

## Weather Data Source

Use OpenWeather API.

## Weather Page Should Show

- Current weather for today’s destination
- Temperature
- Rain probability
- Wind speed
- Wind gusts
- Weather warnings
- 5-day forecast

## Important Weather Risk Rules

Show alerts when:

- Temperature is above 30°C
- Wind gusts are above 45 km/h
- Rain probability is above 60%
- Storms are reported
- Mountain passes may have snow or ice

## Key Weather Risk Areas

- Texas heat
- Utah desert heat
- Mojave desert heat
- Pacific coast fog
- Columbia Gorge wind
- Rockies snow or ice
- Yellowstone weather swings

---

# 6. Hosts & Sleep Page

## Goal

Keep all overnight plans organized.

## Fields

- Day number
- City/area
- Sleep type
- Host name
- Address or general location
- Phone/email if available
- Backup option 1
- Backup option 2
- Notes

## Sleep Type Categories

- Home
- Friend/host
- Motel
- Campground
- Free camping
- TBD

## App Behavior

Highlight missing sleep locations clearly.

Example warning:

> Sleep location not confirmed. Add backup before ride day.

---

# 7. Motorcycle Maintenance Page

## Goal

Prevent breakdowns on the road.

## Before Trip Checklist

- Oil and filter
- Valve clearance
- Air filter
- Chain and sprockets
- Tires
- Tubes
- Brake pads
- Wheel bearings
- Spokes
- Fork seals
- Battery
- Lights
- Tools

## Daily Bike Check

Every morning:

- Tire pressure
- Oil level
- Chain condition
- Luggage bolts
- Brake feel
- Lights

Every evening:

- Fuel bike
- Inspect tires
- Check chain
- Charge electronics
- Backup footage

## Maintenance Intervals

```js
const maintenanceRules = {
  chainLubeKm: 500,
  chainInspectionDaily: true,
  oilCheckDaily: true,
  airFilterCheckDustyDays: true,
  boltCheckRestDays: true
}
```

## Major Maintenance Stops

- Fort Worth
- Moab
- Seattle
- Yellowstone gateway
- Toronto after return

---

# 8. Packing Page

## Goal

Make packing simple and grouped.

## Categories

### Documents

- Passport
- Driver license with motorcycle endorsement
- Vehicle registration
- Insurance
- Medical/travel insurance
- Emergency contact sheet

### Riding Gear

- Helmet
- Jacket
- Pants
- Gloves
- Boots
- Rain suit
- Cold layer
- Earplugs

### Camping Gear

- Tent
- Sleeping bag
- Sleeping pad
- Stove
- Headlamp
- Water storage
- Food kit

### Tools & Spares

- Tire irons
- Tubes
- Pump/CO2
- Chain lube
- Spare fuses
- Zip ties
- Electrical tape
- Basic tool roll

### Electronics

- Phone
- Camera
- Microphone
- Batteries
- Chargers
- Power bank
- Memory cards
- Laptop/tablet if needed

## Packing App Feature

Allow every item to have:

```js
{
  name: 'Passport',
  category: 'Documents',
  packed: false,
  required: true,
  notes: ''
}
```

---

# 9. Budget Page

## Goal

Track planned vs actual trip spending.

## Budget Categories

- Fuel
- Food
- Accommodation
- Park fees
- Motorcycle maintenance
- Camping
- Emergency
- Content gear
- Miscellaneous

## Daily Budget Object

```js
const dailyBudget = {
  day: 1,
  fuel: 0,
  food: 0,
  accommodation: 0,
  maintenance: 0,
  misc: 0,
  notes: ''
}
```

## Budget Features

- Daily spending
- Total spending
- Average per day
- Remaining budget
- Over-budget warning

---

# 10. Content Plan Page

## Goal

Help create YouTube, Instagram, and reel content during the trip.

## Daily Content Structure

Each day should have:

1. Morning intro
2. Route briefing
3. Riding shots
4. Scenic stop
5. Challenge/problem
6. Emotional moment
7. Evening recap

## Hero Episode Ideas

- Leaving Toronto
- Border crossing
- Blue Ridge Parkway
- Tail of the Dragon
- Fort Worth home stop
- Million Dollar Highway
- Monument Valley
- Moab and Arches
- First Pacific Ocean view
- Big Sur
- Redwood National Park
- Seattle arrival
- North Cascades
- Yellowstone
- Beartooth Highway
- Returning home

## Content Object

```js
const contentPlan = {
  day: 1,
  titleIdea: 'Leaving Toronto for a 36-Day USA Motorcycle Loop',
  introShot: true,
  ridingShots: true,
  droneShots: false,
  reelIdea: 'The journey begins',
  youtubeEpisode: true,
  notes: ''
}
```

---

# 11. Emergency Page

## Goal

Keep emergency information available offline.

## Emergency Information

- Rider name
- Emergency contacts
- Insurance details
- Motorcycle VIN
- Motorcycle plate
- Roadside assistance number
- Medical notes
- Passport copy location
- Nearest hospitals if needed

## Emergency Rules

Stop riding immediately if:

- Severe fatigue
- Heavy storm
- Dangerous wind
- Mechanical issue affects brakes, steering, or tires
- Poor visibility
- Animal collision risk is high

---

# 12. Documents Page

## Goal

Store document reminders and links.

## Documents to Track

- Passport
- Driver license
- Motorcycle registration
- Insurance
- Travel medical coverage
- Roadside assistance
- Border crossing documents
- Park passes
- Camping reservations
- Host confirmations

## Document Object

```js
const documentItem = {
  name: 'Passport',
  status: 'Confirmed',
  expiryDate: '',
  fileUrl: '',
  notes: ''
}
```

---

# 13. Notes Page

## Goal

Allow fast note-taking during the trip.

## Note Types

- Daily journal
- Bike issue
- Content idea
- Expense note
- Route change
- Host note
- Emergency note

## Note Object

```js
const note = {
  id: crypto.randomUUID(),
  day: 1,
  type: 'Daily journal',
  text: '',
  createdAt: new Date().toISOString()
}
```

---

# 14. Data Structure Recommendation

Create a folder like this:

```text
/src
  /data
    tripInfo.js
    routeDays.js
    packingList.js
    maintenance.js
    budget.js
    contentPlan.js
    emergencyInfo.js
  /components
    DashboardCard.jsx
    DayCard.jsx
    WeatherCard.jsx
    Checklist.jsx
    BudgetTracker.jsx
    MaintenanceReminder.jsx
  /pages
    Dashboard.jsx
    Route.jsx
    DailyPlan.jsx
    Weather.jsx
    Hosts.jsx
    Maintenance.jsx
    Packing.jsx
    Budget.jsx
    Content.jsx
    Emergency.jsx
    Documents.jsx
    Notes.jsx
```

---

# 15. Main Trip Data Model

Use this as the core model for every day.

```js
export const routeDays = [
  {
    day: 1,
    date: '2026-05-20',
    leg: 1,
    from: 'Toronto, ON',
    to: 'Horseheads, NY',
    distanceKm: 388.8,
    rideTime: '4 h 9 min',
    highlight: 'US entry documentation ready',
    sleep: 'Jimmy & Kaylee Comfort',
    routeType: 'Highway / border crossing',
    riskNotes: ['Border crossing', 'Traffic', 'First day adjustment'],
    contentIdeas: ['Trip start', 'Bike walkaround', 'Leaving Toronto'],
    bikeChecks: ['Tires', 'Oil', 'Chain', 'Luggage bolts'],
    googleMapsUrl: '',
    weatherLocation: 'Horseheads, NY',
    notes: ''
  }
]
```

---

# 16. UI Priority

Build in this order:

1. Dashboard
2. Daily Plan
3. Route Overview
4. Weather
5. Packing
6. Maintenance
7. Hosts
8. Budget
9. Content
10. Emergency
11. Documents
12. Notes

Do not build everything at once. Make each section clean and functional first.

---

# 17. Mobile-First Design

This app will be used on the road, so it must be mobile-first.

## Design Requirements

- Large readable text
- Big buttons
- Dark mode support
- Offline-friendly layout
- Fast loading
- Minimal animations
- Clear warning colors
- Simple navigation tabs

## Important Mobile Features

- Today button
- Next day button
- Weather alert section
- Emergency button
- Packing checklist
- Maintenance checklist

---

# 18. Best Navigation Flow

Recommended bottom navigation:

1. Today
2. Route
3. Weather
4. Bike
5. More

Inside More:

- Packing
- Budget
- Content
- Hosts
- Documents
- Emergency
- Notes

---

# 19. Cursor Instructions

Use this file as the main product requirement document.

## Cursor Should Do This

1. Read this plan first.
2. Build the app section by section.
3. Keep all trip data in reusable data files.
4. Avoid hardcoding repeated content inside components.
5. Make the design mobile-first.
6. Keep the interface simple enough to use while traveling.
7. Add warnings for weather, long-distance days, and missing sleep locations.
8. Make the daily plan the main working page.

## Cursor Prompt to Use

```text
Read the file USA_Loop_Cursor_Project_Plan.md and help me organize my existing trip app according to this structure. First inspect my current project files, then suggest the exact changes needed. Do not rewrite everything at once. Start by creating the data structure and improving the Dashboard and Daily Plan pages.
```

---

# 20. Development Milestones

## Milestone 1 — Data Cleanup

- Create routeDays.js
- Create packingList.js
- Create maintenance.js
- Create contentPlan.js
- Create emergencyInfo.js

## Milestone 2 — Main Pages

- Dashboard
- Daily Plan
- Route Overview

## Milestone 3 — Safety Features

- Weather warnings
- Maintenance reminders
- Emergency page

## Milestone 4 — Productivity Features

- Packing checklist
- Budget tracker
- Notes
- Content tracker

## Milestone 5 — Polish

- Mobile layout
- Better navigation
- Better cards
- Offline-friendly improvements

---

# 21. Final Rule

The app should not just show information.

It should help answer this question every day:

> What do I need to know right now to ride safely, stay organized, create content, and reach tonight’s destination?
