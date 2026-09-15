# Interactive 2D & 3D Modular Dock Builder
## Project Brief & Milestone 1 Scope

**Milestone 1 of 5 — 2D Grid-Based Dock Builder Prototype**

---

## 1. About the project

The client manufactures a modular floating dock system. The docks are built from
interconnecting plastic floats, and **each float is 500mm × 500mm × 400mm**. Customers
join these cubes together to create docks, pontoons, walkways, jetty fingers and floating
platforms in whatever size and shape they need.

At the moment customers have to call or email to describe what they want. The client wants
an online configurator on their WordPress website where a customer can design their own dock
themselves.

The finished product will let a customer:

1. Lay out their dock on a 500mm grid in a simple 2D interface
2. View the same dock as an interactive 3D model
3. Add accessories (handrails, gangways, cleats, ladders and so on)
4. Automatically see the components required for their design
5. See an estimated price, or submit the design as a formal quote request

The interface has to be usable by an ordinary customer with no CAD experience.

### The core idea behind the whole system

Everything in the application — the 2D layout, the dimensions, the 3D model, the component
list and the pricing — is generated from **one single set of configuration data**.

There is no separate "2D version" and "3D version" of the dock. The customer's design is
stored once, and every part of the application reads from it. When a cube is added or
removed, the dimensions, the 3D model and the component list all update from that same change.

This is the most important part of the project. Milestone 1 exists to prove this works
before we build anything else on top of it.

---

## 2. Reference examples

The client provided these two live configurators as a reference for the type of tool they
want. They are directly relevant to Milestone 1 and should be reviewed before development
starts.

**2D configurator** — the grid-based dock builder we are building in this milestone:
https://buldock.com/get-a-quote/2d-configurator/

**3D configurator** — the 3D view generated from the same design:
https://buldock.com/3d-configurator/

Worth paying attention to in the 2D example: how cubes are placed and removed, how the grid
behaves while zooming and panning, how the overall dimensions are displayed, how the outline
of the dock is shown, and how the component list updates as the design changes.

Note that these are finished commercial products. Milestone 1 is a working prototype of the
same underlying behaviour, not a match for their visual design.

---

## 3. Technology stack (already agreed with the client)

| Layer | Choice |
|---|---|
| Framework | Next.js + React + TypeScript |
| 2D builder | HTML5 Canvas |
| 3D viewer | Three.js + React Three Fiber |
| Backend | Node.js / Next.js |
| Database | PostgreSQL (Supabase) |
| Styling | Tailwind CSS |

Canvas was chosen over SVG for the 2D builder because a dock can contain several hundred
cubes, with constant zooming, panning and selection. Canvas gives far better control over
rendering performance at that scale.

---

## 4. The five milestones

1. 2D Grid-Based Dock Builder Prototype ← **this milestone**
2. Accessories, Component Calculations & Bill of Materials
3. Interactive 3D Visualisation (realistic models)
4. Pricing & Quote Generation
5. Admin Controls, Website Integration & Mobile Optimisation

---

# MILESTONE 1 — 2D Grid-Based Dock Builder Prototype

## 5. Objective

Build a working technical prototype that proves the core system works correctly.

The customer should be able to create a modular dock in 2D, see its dimensions, have the
system identify adjacent cubes and exposed edges, produce a basic component calculation,
save and load the design, load a predefined template, and view the same design in a basic
interactive 3D view.

**The UI and the 3D models are intentionally basic at this stage.** We are not building the
final look of the product in this milestone. The goal is to prove the underlying system is
correct before spending time on accessories, realistic 3D models, pricing and final design.

---

## 6. Milestone 1 scope

### 6.1 The 2D builder

The workspace is a grid where every cell represents one 500mm × 500mm float.

- A 500mm × 500mm grid workspace
- Add cubes by clicking
- Add cubes by clicking and dragging, so a run or block of cubes can be placed in one action
- Remove cubes
- Build rectangular docks
- Build custom shapes, including L-shapes, fingers and walkways
- Zoom in and out
- Pan around the workspace
- Undo and redo, with a single drag action counting as one undo step rather than one per cube
- Start from a blank design
- Overall dock dimensions displayed and updating automatically as the design changes,
  shown in both millimetres and metres
- The dock outline and exposed edges clearly shown on the layout
- A live panel showing the cube count, the overall dimensions and the calculated components

The design can be built in any direction from the starting point — the customer should not be
restricted to building only right and down from a fixed origin.

### 6.2 Configuration logic

This is the part that matters most in this milestone. It should be built as its own layer,
independent of the 2D drawing and the 3D view, so both simply read from it.

- Each cube is stored by its X/Y position on the grid
- Detection of which cubes are next to each other
- Detection of which cube edges are on the outside of the dock (exposed edges)
- Basic connection calculation, based on the connection information the client provides
- Basic component list calculation, shown live as the design changes
- Basic validation of the design — for example, warning the user if the design has become
  two separate disconnected sections

Exposed-edge detection needs to be reliable because it is what accessories attach to in
Milestone 2. Handrails, kickboards, cleats and ladders all sit on the outside edges of the
dock, so this logic is being built once here and reused later.

The connection and component rules must **not** be invented or assumed. The client is
supplying photographs, drawings and specifications of their physical connection system, and
the rules will be documented together during this milestone. Until then, these rules are kept
as configurable settings that can be swapped easily, never built into the interface.

### 6.3 Templates

- 2 to 3 predefined dock templates
- Load a template into the workspace
- Modify a template after loading it, exactly like any other design

### 6.4 Save and load

- Save a design
- Load a saved design, reproducing the identical layout, dimensions and component list
- The underlying configuration data is preserved exactly

A simple export/import of a saved design as a file is also worth including. During client
testing it makes it much easier for the client to send back a specific design that produced
an unexpected result.

### 6.5 Basic 3D view

- The 3D dock is generated from the same design the customer created in 2D
- Basic cube geometry based on the actual 500 × 500 × 400mm product
- Rotate, zoom and pan the 3D model
- Switch between the 2D and 3D views
- The 3D view always matches the current 2D design

The 3D must be built so it can handle several hundred cubes without slowing down, and it
should update efficiently rather than rebuilding the whole scene every time a single cube
changes. Plain grey material is fine — the realistic branded cube model belongs to
Milestone 3.

---

## 7. Milestone 1 acceptance criteria

These were agreed directly with the client. Every item must work before the milestone is
submitted.

| # | Criterion |
|---|---|
| 1 | 500mm × 500mm grid with zoom and pan |
| 2 | Add cubes by click |
| 3 | Add cubes by click and drag |
| 4 | Remove cubes |
| 5 | Build basic custom layouts, including L-shapes and fingers |
| 6 | Automatic overall dimensions, updating live |
| 7 | Design stored as X/Y configuration data, separate from the 2D and 3D views |
| 8 | Adjacent cube detection |
| 9 | Exposed-edge detection, clearly shown on the 2D layout |
| 10 | Initial connection calculation based on the rules provided by the client |
| 11 | Initial component/BOM calculation, displayed live |
| 12 | Undo and redo |
| 13 | Save a configuration |
| 14 | Load a configuration, reproducing the identical result |
| 15 | 2–3 predefined templates, loadable and editable |
| 16 | Basic 3D generated from the same configuration |
| 17 | Rotate, zoom and pan in 3D |
| 18 | 2D and 3D always stay in sync |

---

## 8. Client test configurations

The client will test the prototype against four real dock layouts before accepting the
milestone. All four should be built and checked internally first.

1. **3m × 2m rectangular dock**
2. **8m × 2m work pontoon**
3. **L-shaped dock**
4. **Dock with a finger**

The exact L-shape and finger layouts will be supplied by the client.

For each one we verify: the overall dimensions, the cube arrangement, adjacent cube
detection, exposed edges, the connection and component calculation, save and load, and that
the 3D view matches the 2D design.

The client will also supply their own manually counted component quantities for these
layouts, so our calculations can be checked against real-world numbers rather than assumed
ones.

---

## 9. Not included in Milestone 1

These items belong to later milestones and should not be started now.

| Item | Milestone |
|---|---|
| Accessories (handrails, kickboards, gangways, cleats, ladders, mooring, boat/jet ski) | 2 |
| Full connection and component rules for the complete product catalogue | 2 |
| Realistic cube models, branded textures, materials, water/environment | 3 |
| Pricing, purchase and hire rates, GST, delivery, Request a Quote | 4 |
| Customer enquiry form, quote reference, PDF quote generation | 4 |
| Admin panel and login | 5 |
| WordPress website integration | 5 |
| Mobile and tablet optimisation, final UI design | 5 |

Milestone 1 should still open and run on a tablet or phone, but touch optimisation and the
final visual design are Milestone 5 work.

---

## 10. What the client is providing

Development can start immediately on the grid, the builder, templates, save/load and the 3D
view. Only the connection and component calculation depends on the following:

1. Photographs and drawings of the 500 × 500 × 400mm cube
2. Photographs, drawings and specifications of the connection pins and components, showing
   where each one is used and how many are required
3. The four real dock configurations listed above, with the client's own manually counted
   component quantities
4. The initial accessory list and reference images (needed for planning Milestones 2 and 3,
   not for Milestone 1)

Every connection rule confirmed by the client during this milestone should be written down in
a project document as it is agreed. That document becomes the basis for the admin panel rules
in Milestone 5.

---

## 11. Suggested development sequence

**Stage 1 — Configuration layer**
Project setup, then the core configuration system: the grid, cube positions, adjacency
detection, exposed-edge detection, dimensions, validation, undo/redo and save/load. Build and
verify this layer on its own before any interface work begins.

**Stage 2 — Interfaces**
The 2D Canvas builder: drawing the grid and cubes, click and drag placement, removal, zoom
and pan, dock outline, dimensions panel and component panel. Templates. Then the basic 3D
view with rotate, zoom, pan and the 2D/3D toggle.

**Stage 3 — Validation**
Apply the connection and component rules once the client's technical package arrives. Build
and verify the four client test configurations. Performance check with several hundred cubes.
Documentation and a preview build for the client to test.

---

## 12. Definition of done

- All 18 acceptance criteria work
- All four client test configurations produce correct dimensions and component quantities,
  matching the client's manual counts, or any difference is explained by a rule the client
  still needs to confirm
- A design with several hundred cubes stays responsive in both 2D and 3D
- The connection rules confirmed so far are documented alongside the project
- A working preview build is available for the client to test
