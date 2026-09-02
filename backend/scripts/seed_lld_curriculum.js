import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const lldArenas = [
  {
    name: 'LLD Phase 1',
    key: 'LLDP1',
    description: 'Foundations of Object-Oriented Design, OOAD & UML Modeling',
    parents: [
      {
        id: 'LLDP1-P1',
        name: 'OOP & Design Foundations',
        description: 'Build the object-oriented foundation required for LLD. Learn how to model real-world entities, assign responsibilities, define relationships, and design maintainable classes.',
        children: [
          {
            id: 'LLDP1-001',
            name: 'Classes, Objects & Encapsulation',
            description: 'Understand how classes act as blueprints for runtime objects and how encapsulation bundles state with behavior while protecting internal integrity.'
          },
          {
            id: 'LLDP1-002',
            name: 'Abstraction & Interfaces',
            description: 'Understand how abstraction hides unnecessary implementation details and how interfaces define contracts between collaborating objects. Learn when to use abstract classes and interfaces when designing extensible systems.'
          },
          {
            id: 'LLDP1-003',
            name: 'Constructors & Destructors',
            description: 'Learn the lifecycle of objects, proper resource initialization, dependency provisioning during instantiation, and safe teardown mechanics.'
          },
          {
            id: 'LLDP1-004',
            name: 'Inheritance',
            description: 'Understand the is-a relationship and how inheritance enables code reuse and hierarchical domain modeling, along with its potential coupling pitfalls.'
          },
          {
            id: 'LLDP1-005',
            name: 'Polymorphism',
            description: 'Learn how polymorphism allows objects of different types to be treated through a uniform interface, enabling dynamic dispatch and extensible code.'
          },
          {
            id: 'LLDP1-006',
            name: 'Virtual & Pure Virtual Functions',
            description: 'Master dynamic binding, vtables, runtime method dispatch, and how pure virtual functions define abstract interfaces in object-oriented languages.'
          },
          {
            id: 'LLDP1-007',
            name: 'Abstract Classes & Interfaces',
            description: 'Compare abstract base classes versus pure interfaces to decide when to share reusable state and default logic versus enforcing strict contracts.'
          },
          {
            id: 'LLDP1-008',
            name: 'Association, Aggregation & Composition',
            description: 'Distinguish between uses-a, has-a (shared lifetime), and owns-a (exclusive lifecycle) object relationships to build accurate domain models.'
          },
          {
            id: 'LLDP1-009',
            name: 'Composition vs Inheritance',
            description: 'Analyze why favoring object composition over class inheritance yields more flexible, loosely coupled systems that are resilient to requirement changes.'
          },
          {
            id: 'LLDP1-010',
            name: 'Dependency & Dependency Injection Basics',
            description: 'Learn how dependencies between classes arise and how injecting dependencies from the outside decouples class creation from class usage.'
          },
          {
            id: 'LLDP1-011',
            name: 'Pointers, References & Object Lifetime',
            description: 'Understand memory semantics, object ownership boundaries, reference passing, and how object lifecycle management prevents memory leaks and dangling references.'
          },
          {
            id: 'LLDP1-012',
            name: 'Designing Classes with Responsibilities',
            description: 'Practice identifying the single core purpose of each class, establishing clear encapsulation boundaries, and keeping methods focused and cohesive.'
          }
        ]
      },
      {
        id: 'LLDP1-P2',
        name: 'OOAD — Object-Oriented Analysis & Design',
        description: 'Learn the end-to-end process of breaking down product requirements into conceptual domain models, identifying core entities, and designing cohesive object interactions.',
        children: [
          {
            id: 'LLDP1-013',
            name: 'Introduction to OOAD & Design Thinking',
            description: 'Understand the fundamental mindset of object-oriented analysis, shifting from procedural logic to modeling domain concepts as autonomous entities.'
          },
          {
            id: 'LLDP1-014',
            name: 'From Requirements to Objects',
            description: 'Learn systematic techniques like noun-verb analysis and use-case breakdown to extract domain entities and behaviors directly from business requirements.'
          },
          {
            id: 'LLDP1-015',
            name: 'Identifying Classes & Responsibilities',
            description: 'Apply Responsibility-Driven Design (RDD) and CRC card modeling to cleanly delineate what each entity knows and what each entity does.'
          },
          {
            id: 'LLDP1-016',
            name: 'Designing Relationships Between Objects',
            description: 'Determine the correct cardinality, multiplicity, and structural coupling between identified domain entities to reflect real-world business rules.'
          },
          {
            id: 'LLDP1-017',
            name: 'Abstraction & Interface Design',
            description: 'Formulate clean API boundaries and abstract contracts for domain services to ensure high modularity and swap-in flexibility.'
          },
          {
            id: 'LLDP1-018',
            name: 'Object Collaboration & Interaction',
            description: 'Map out message passing sequences and data flow between collaborating objects to fulfill end-to-end system use cases without circular dependencies.'
          },
          {
            id: 'LLDP1-019',
            name: 'Designing for Cohesion & Coupling',
            description: 'Evaluate design alternatives using high cohesion and loose coupling metrics to build robust components that can evolve independently.'
          },
          {
            id: 'LLDP1-020',
            name: 'Object Lifecycle & State',
            description: 'Model the valid state transitions and lifecycle stages of core business entities from creation to completion or cancellation.'
          },
          {
            id: 'LLDP1-021',
            name: 'End-to-End Object-Oriented Design Exercise',
            description: 'Synthesize all OOAD steps by taking a raw requirement prompt and transforming it into a complete, structured domain model with entities and relationships.'
          }
        ]
      },
      {
        id: 'LLDP1-P3',
        name: 'UML & Design Modeling',
        description: 'Master visual modeling using industry-standard UML diagrams to communicate architecture, structural relationships, and dynamic object interactions clearly.',
        children: [
          {
            id: 'LLDP1-022',
            name: 'UML Fundamentals & Class Diagrams',
            description: 'Learn UML standard notation, class boxes, visibility modifiers (+, -, #), attributes, and method signatures for clear technical documentation.'
          },
          {
            id: 'LLDP1-023',
            name: 'Class Relationships in UML',
            description: 'Master the visual notation for association, aggregation, composition, inheritance (generalization), and interface implementation (realization).'
          },
          {
            id: 'LLDP1-024',
            name: 'Designing Class Diagrams',
            description: 'Practice drafting comprehensive static architecture diagrams that accurately reflect domain entities, relationships, and design patterns.'
          },
          {
            id: 'LLDP1-025',
            name: 'Sequence Diagrams',
            description: 'Model time-ordered message passing, synchronous/asynchronous calls, object lifelines, and activation bars during specific runtime use cases.'
          },
          {
            id: 'LLDP1-026',
            name: 'State Diagrams',
            description: 'Visualize stateful entity behaviors, transition triggers, guards, and exit actions to prevent illegal state mutations in complex domains.'
          },
          {
            id: 'LLDP1-027',
            name: 'Activity Diagrams',
            description: 'Map out workflow logic, decision branching, parallel fork/join operations, and data pipelines across collaborating system components.'
          },
          {
            id: 'LLDP1-028',
            name: 'Choosing the Right UML Diagram',
            description: 'Learn which UML diagram best communicates structural vs behavioral requirements depending on the architectural question being answered.'
          },
          {
            id: 'LLDP1-029',
            name: 'End-to-End UML Design Exercise',
            description: 'Draft a complete UML blueprint for a real-world system including Class, Sequence, and State diagrams to validate system feasibility.'
          }
        ]
      }
    ]
  },
  {
    name: 'LLD Phase 2',
    key: 'LLDP2',
    description: 'Design Principles, SOLID & Clean Architecture Refactoring',
    parents: [
      {
        id: 'LLDP2-P1',
        name: 'SOLID Principles',
        description: 'Master the 5 foundational SOLID principles to write clean, modular, and maintainable software that accommodates change without breaking existing functionality.',
        children: [
          {
            id: 'LLDP2-001',
            name: 'Single Responsibility Principle (SRP)',
            description: 'Understand that every module or class should have one, and only one, reason to change, isolating business logic from infrastructure concerns.'
          },
          {
            id: 'LLDP2-002',
            name: 'Open/Closed Principle (OCP)',
            description: 'Learn how to make classes open for extension but closed for modification using interfaces and polymorphism to add features without editing tested code.'
          },
          {
            id: 'LLDP2-003',
            name: 'Liskov Substitution Principle (LSP)',
            description: 'Ensure derived classes are completely substitutable for their base types without altering system correctness, avoiding fragile subclassing.'
          },
          {
            id: 'LLDP2-004',
            name: 'Interface Segregation Principle (ISP)',
            description: 'Design small, client-specific interfaces rather than large, bloated contracts so implementing classes are not forced to depend on unused methods.'
          },
          {
            id: 'LLDP2-005',
            name: 'Dependency Inversion Principle (DIP)',
            description: 'Decouple high-level business modules from low-level infrastructure details by having both depend on abstractions rather than concrete classes.'
          },
          {
            id: 'LLDP2-006',
            name: 'SOLID Combined Refactoring',
            description: 'Take a heavily coupled legacy codebase violating multiple principles and systematically refactor it into a clean, SOLID-compliant architecture.'
          }
        ]
      },
      {
        id: 'LLDP2-P2',
        name: 'Core Design Principles',
        description: 'Explore essential software engineering principles beyond SOLID that govern clean architecture, encapsulation boundaries, and testability.',
        children: [
          {
            id: 'LLDP2-007',
            name: 'Favor Composition Over Inheritance',
            description: 'Learn how object composition provides greater runtime flexibility and prevents rigid class hierarchies that become difficult to refactor.'
          },
          {
            id: 'LLDP2-008',
            name: 'Program to an Interface',
            description: 'Understand how coding against abstract types rather than concrete implementations decouples clients and simplifies unit testing and mocking.'
          },
          {
            id: 'LLDP2-009',
            name: 'Dependency Injection & Inversion of Control',
            description: 'Master the IoC pattern and dependency injection strategies (constructor, setter, interface) to eliminate hardcoded dependencies.'
          },
          {
            id: 'LLDP2-010',
            name: 'Low Coupling & High Cohesion',
            description: 'Learn to evaluate module quality by ensuring components focus tightly on related tasks while minimizing external interdependencies.'
          },
          {
            id: 'LLDP2-011',
            name: 'Immutability & Encapsulation Boundaries',
            description: 'Design immutable data structures and defend encapsulation boundaries to prevent unexpected side effects in multi-threaded and concurrent environments.'
          },
          {
            id: 'LLDP2-012',
            name: 'Separation of Concerns & Law of Demeter',
            description: 'Apply the Principle of Least Knowledge to ensure an object talks only to its immediate friends, preventing fragile method-chaining leaks.'
          },
          {
            id: 'LLDP2-013',
            name: 'Designing for Extensibility & Testability',
            description: 'Structure classes so new behaviors can be plugged in easily and business logic can be thoroughly unit-tested without complex harness setups.'
          }
        ]
      },
      {
        id: 'LLDP2-P3',
        name: 'Code Smells & Refactoring',
        description: 'Identify common architectural antipatterns and code smells, learning systematic refactoring techniques to transform brittle code into resilient designs.',
        children: [
          {
            id: 'LLDP2-014',
            name: 'Avoiding God Classes & Large Classes',
            description: 'Learn to detect and dismantle bloated orchestrator classes by extracting cohesive sub-components with well-defined single responsibilities.'
          },
          {
            id: 'LLDP2-015',
            name: 'Eliminating Tight Coupling & Large Conditionals',
            description: 'Replace giant if-else and switch statements with polymorphism, lookup strategies, or state patterns to streamline branching logic.'
          },
          {
            id: 'LLDP2-016',
            name: 'Primitive Obsession & Feature Envy',
            description: 'Recognize when simple primitives should be encapsulated into rich value objects, and relocate misplaced methods to the classes that own the data.'
          },
          {
            id: 'LLDP2-017',
            name: 'Avoiding Over-Engineering & YAGNI',
            description: 'Learn to balance clean architecture with pragmatic simplicity, avoiding speculative abstractions and unnecessary design pattern complexity.'
          },
          {
            id: 'LLDP2-018',
            name: 'Refactoring Toward Clean Object-Oriented Design',
            description: 'Practice step-by-step refactoring moves while keeping tests passing, migrating tangled legacy code into an elegant, maintainable structure.'
          }
        ]
      }
    ]
  },
  {
    name: 'LLD Phase 3',
    key: 'LLDP3',
    description: 'Creational, Structural & Behavioral Design Patterns',
    parents: [
      {
        id: 'LLDP3-P1',
        name: 'Creational Design Patterns',
        description: 'Master object creation mechanisms to instantiate classes flexibly, control object lifecycles, and decouple callers from concrete instantiations.',
        children: [
          {
            id: 'LLDP3-001',
            name: 'Factory Method',
            description: 'Define an interface for creating an object while letting subclasses decide which concrete class to instantiate, decoupling client logic.'
          },
          {
            id: 'LLDP3-002',
            name: 'Abstract Factory',
            description: 'Provide an interface for creating families of related or dependent objects without specifying their concrete classes.'
          },
          {
            id: 'LLDP3-003',
            name: 'Builder',
            description: 'Construct complex objects step-by-step with readable, fluent APIs, separating construction logic from representation.'
          },
          {
            id: 'LLDP3-004',
            name: 'Prototype',
            description: 'Create new objects by cloning existing instances, optimizing performance when object creation is resource-intensive.'
          },
          {
            id: 'LLDP3-005',
            name: 'Singleton',
            description: 'Ensure a class has only one instance while providing a global access point, handling thread safety and lazy initialization properly.'
          }
        ]
      },
      {
        id: 'LLDP3-P2',
        name: 'Structural Design Patterns',
        description: 'Learn how to assemble classes and objects into larger, flexible structures while keeping individual components loosely coupled and reusable.',
        children: [
          {
            id: 'LLDP3-006',
            name: 'Adapter',
            description: 'Convert the interface of a class into another interface clients expect, enabling incompatible classes to work together seamlessly.'
          },
          {
            id: 'LLDP3-007',
            name: 'Decorator',
            description: 'Attach additional responsibilities and dynamic behaviors to an object at runtime without altering its original class structure.'
          },
          {
            id: 'LLDP3-008',
            name: 'Facade',
            description: 'Provide a unified, simplified high-level interface to a complex subsystem or set of micro-components to enhance usability.'
          },
          {
            id: 'LLDP3-009',
            name: 'Proxy',
            description: 'Provide a surrogate or placeholder for another object to control access, perform lazy loading, caching, or access control.'
          },
          {
            id: 'LLDP3-010',
            name: 'Composite',
            description: 'Compose objects into tree structures to represent part-whole hierarchies, allowing clients to treat individual objects and compositions uniformly.'
          },
          {
            id: 'LLDP3-011',
            name: 'Bridge',
            description: 'Decouple an abstraction from its implementation so that both can vary independently without exponential subclass explosion.'
          },
          {
            id: 'LLDP3-012',
            name: 'Flyweight',
            description: 'Minimize memory usage by sharing common fine-grained state among large numbers of similar objects.'
          }
        ]
      },
      {
        id: 'LLDP3-P3',
        name: 'Behavioral Design Patterns',
        description: 'Master algorithms, object collaboration, and the assignment of responsibilities between communicating objects.',
        children: [
          {
            id: 'LLDP3-013',
            name: 'Strategy',
            description: 'Define a family of interchangeable algorithms, encapsulate each one, and make them swappable at runtime based on context.'
          },
          {
            id: 'LLDP3-014',
            name: 'Observer',
            description: 'Establish a one-to-many dependency between objects so that when one object changes state, all its dependents are automatically notified.'
          },
          {
            id: 'LLDP3-015',
            name: 'Command',
            description: 'Encapsulate a request as a standalone object, enabling parameterization of clients, queuing, logging, and undo/redo operations.'
          },
          {
            id: 'LLDP3-016',
            name: 'State',
            description: 'Allow an object to alter its behavior when its internal state changes, appearing as if the object changed its class.'
          },
          {
            id: 'LLDP3-017',
            name: 'Template Method',
            description: 'Define the skeleton of an algorithm in a base method, deferring specific steps to subclasses without altering the algorithm structure.'
          },
          {
            id: 'LLDP3-018',
            name: 'Chain of Responsibility',
            description: 'Pass requests along a dynamic chain of potential handlers until one handles the request, decoupling sender from receiver.'
          },
          {
            id: 'LLDP3-019',
            name: 'Iterator',
            description: 'Provide a standard way to access elements of an aggregate collection sequentially without exposing its underlying representation.'
          },
          {
            id: 'LLDP3-020',
            name: 'Mediator',
            description: 'Define an object that encapsulates how a set of objects interact, preventing direct dependencies and keeping communication centralized.'
          },
          {
            id: 'LLDP3-021',
            name: 'Memento',
            description: 'Capture and externalize an object internal state without violating encapsulation, allowing the object to be restored to that state later.'
          },
          {
            id: 'LLDP3-022',
            name: 'Visitor',
            description: 'Represent an operation to be performed on elements of an object structure, letting you define new operations without changing element classes.'
          }
        ]
      },
      {
        id: 'LLDP3-P4',
        name: 'Pattern Selection & Refactoring',
        description: 'Develop architectural judgment to choose the right patterns, combine patterns harmoniously, and avoid anti-patterns and over-engineering.',
        children: [
          {
            id: 'LLDP3-023',
            name: 'When to Use Creational / Structural / Behavioral Patterns',
            description: 'Build a quick decision matrix to categorize software problems and instantly select the appropriate pattern category.'
          },
          {
            id: 'LLDP3-024',
            name: 'Pattern Selection & Avoiding Anti-Patterns',
            description: 'Learn how to recognize when a pattern adds unnecessary complexity versus when it provides vital architectural flexibility.'
          },
          {
            id: 'LLDP3-025',
            name: 'Combining Design Patterns in Complex Systems',
            description: 'Study how real-world architectures blend multiple patterns (e.g. Factory + Strategy + Observer) into cohesive sub-systems.'
          },
          {
            id: 'LLDP3-026',
            name: 'Pattern Refactoring Exercise',
            description: 'Refactor an unorganized code snippet by introducing appropriate design patterns to improve maintainability and testability.'
          }
        ]
      }
    ]
  },
  {
    name: 'LLD Phase 4',
    key: 'LLDP4',
    description: 'Beginner, Intermediate & Advanced LLD Problem Solving',
    parents: [
      {
        id: 'LLDP4-P1',
        name: 'Beginner LLD Problems',
        description: 'Design foundational real-world systems focusing on entity modeling, clean APIs, and basic state management.',
        children: [
          {
            id: 'LLDP4-001',
            name: 'Tic Tac Toe',
            description: 'Design an N x N Tic Tac Toe game supporting customizable winning conditions, multiple players, board state evaluation, and replay mechanics.'
          },
          {
            id: 'LLDP4-002',
            name: 'Coffee Machine',
            description: 'Design a coffee maker system managing ingredient inventory, drink recipes, concurrent dispensing, and out-of-stock state handling.'
          },
          {
            id: 'LLDP4-003',
            name: 'Vending Machine',
            description: 'Design a stateful vending machine handling item selection, currency validation, change return, and inventory tracking using the State Pattern.'
          },
          {
            id: 'LLDP4-004',
            name: 'Library Management System',
            description: 'Design a library catalog system tracking book copies, member borrowing limits, reservation queues, fine calculation, and barcode search.'
          }
        ]
      },
      {
        id: 'LLDP4-P2',
        name: 'Intermediate LLD Problems',
        description: 'Design complex multi-entity systems requiring flexible pricing strategies, concurrency handling, and allocation algorithms.',
        children: [
          {
            id: 'LLDP4-005',
            name: 'Parking Lot',
            description: 'Design a multi-floor parking lot system supporting multiple vehicle types, parking spot allocation strategies, ticket issuance, and dynamic fee calculation.'
          },
          {
            id: 'LLDP4-006',
            name: 'ATM System',
            description: 'Design an automated teller machine supporting PIN validation, transaction logging, account balance inquiry, cash dispensing, and State-driven flows.'
          },
          {
            id: 'LLDP4-007',
            name: 'Snake & Ladder',
            description: 'Design an extensible Snake & Ladder game supporting custom board dimensions, multiple dice, special snakes/ladders, and configurable player rules.'
          },
          {
            id: 'LLDP4-008',
            name: 'Elevator System',
            description: 'Design an elevator control system managing multiple lifts, internal/external button requests, scheduling dispatch algorithms (SCAN/LOOK), and door states.'
          },
          {
            id: 'LLDP4-009',
            name: 'Car Rental System',
            description: 'Design a vehicle rental platform supporting vehicle search by type/location, reservation management, pickup/drop-off workflows, and damage insurance policies.'
          }
        ]
      },
      {
        id: 'LLDP4-P3',
        name: 'Advanced LLD Problems',
        description: 'Design production-scale systems with complex business rules, distributed domain concepts, transaction handling, and extensible plugins.',
        children: [
          {
            id: 'LLDP4-010',
            name: 'Chess',
            description: 'Design a complete 2-player chess game modeling board squares, distinct piece movements, check/checkmate detection, castling, en passant, and pawn promotion.'
          },
          {
            id: 'LLDP4-011',
            name: 'Splitwise',
            description: 'Design an expense sharing application supporting group creation, exact/percent/equal expense splitting algorithms, and debt graph simplification.'
          },
          {
            id: 'LLDP4-012',
            name: 'BookMyShow',
            description: 'Design a movie ticket booking platform with multi-screen theater layout, concurrent seat reservation locking, payment timeouts, and dynamic show scheduling.'
          },
          {
            id: 'LLDP4-013',
            name: 'Ride Sharing System',
            description: 'Design a ride-hailing system matching riders with nearby drivers, supporting dynamic surge pricing strategies, live trip tracking, and driver dispatch.'
          }
        ]
      },
      {
        id: 'LLDP4-P4',
        name: 'Requirement Change Exercises & Design Review',
        description: 'Practice modifying existing designs against unexpected requirement changes to test extensibility and identify architectural flaws.',
        children: [
          {
            id: 'LLDP4-014',
            name: 'Add Feature & Changing Requirements Exercise',
            description: 'Take an existing problem design (e.g. Parking Lot with VIP slots or EV charging) and incorporate new requirements without breaking existing code.'
          },
          {
            id: 'LLDP4-015',
            name: 'Add Strategy & Dynamic Pricing / Behavior Exercise',
            description: 'Integrate new pricing algorithms and allocation strategies into a live design using the Strategy Pattern to evaluate runtime flexibility.'
          },
          {
            id: 'LLDP4-016',
            name: 'Design Review for SOLID Violations & Coupling',
            description: 'Conduct an in-depth architectural audit on a completed design to identify hidden coupling, God classes, and interface violations.'
          },
          {
            id: 'LLDP4-017',
            name: 'Production-Quality Code Refactoring',
            description: 'Refactor an LLD problem solution to meet production standards, adding error handling, thread safety, and unit test coverage.'
          }
        ]
      }
    ]
  },
  {
    name: 'LLD Phase 5',
    key: 'LLDP5',
    description: 'Interview Approach, Communication, Timed Practice & Final Revision',
    parents: [
      {
        id: 'LLDP5-P1',
        name: 'LLD Interview Approach & Methodology',
        description: 'Master the step-by-step communication framework to structure, scope, design, and code Low Level Design problems within a 45–60 minute interview window.',
        children: [
          {
            id: 'LLDP5-001',
            name: 'Requirement Clarification & Scoping',
            description: 'Learn how to ask high-signal questions, scope functional vs non-functional requirements, and define system constraints during the first 5 minutes of an interview.'
          },
          {
            id: 'LLDP5-002',
            name: 'Identify Core Entities & Responsibilities',
            description: 'Practice rapid entity identification and establish clear boundary definitions before jumping into diagramming or code.'
          },
          {
            id: 'LLDP5-003',
            name: 'Define Class Relationships & Interfaces',
            description: 'Draft interface contracts and object relationship diagrams that clearly demonstrate modularity to the interviewer.'
          },
          {
            id: 'LLDP5-004',
            name: 'Applying SOLID & Design Patterns',
            description: 'Learn when and how to explicitly call out SOLID principles and justify the inclusion of specific design patterns during your interview.'
          },
          {
            id: 'LLDP5-005',
            name: 'Design for Extensibility & Handling Future Changes',
            description: 'Anticipate curveball requirement changes from interviewers and demonstrate how your architecture accommodates new extensions seamlessly.'
          },
          {
            id: 'LLDP5-006',
            name: 'Writing Clean Production Code in Interviews',
            description: 'Master clean coding practices under interview time constraints, focusing on naming conventions, encapsulation, and error handling.'
          }
        ]
      },
      {
        id: 'LLDP5-P2',
        name: 'Interview Communication & Defending Design',
        description: 'Develop strong technical communication skills to think aloud, articulate trade-offs, and defend architectural choices under interviewer pushback.',
        children: [
          {
            id: 'LLDP5-007',
            name: 'Thinking Aloud & Problem Breakdown',
            description: 'Practice verbalizing your thought process continuously while designing so the interviewer understands your rationale and can guide you.'
          },
          {
            id: 'LLDP5-008',
            name: 'Explaining Design Trade-offs & Architecture',
            description: 'Learn how to discuss trade-offs (e.g. complexity vs flexibility, memory vs speed) when presenting your class hierarchy.'
          },
          {
            id: 'LLDP5-009',
            name: 'Defending Design Decisions & Handling Pushback',
            description: 'Handle interviewer challenges gracefully by explaining design alternatives and adapting your solution constructively without being defensive.'
          },
          {
            id: 'LLDP5-010',
            name: 'Presenting an LLD in an Interview (End-to-End Walkthrough)',
            description: 'Execute a full 45-minute verbal and visual walkthrough of a complete design problem from requirements to clean implementation code.'
          }
        ]
      },
      {
        id: 'LLDP5-P3',
        name: 'Timed Practice & Mock Interviews',
        description: 'Build interview speed and stamina through structured time-boxed sprints and full-length mock interview simulations.',
        children: [
          {
            id: 'LLDP5-011',
            name: '30-Minute Fast LLD Sprint',
            description: 'Practice rapid requirement scoping, entity mapping, and interface definition under strict 30-minute time pressure.'
          },
          {
            id: 'LLDP5-012',
            name: '45-Minute Standard LLD Interview Session',
            description: 'Simulate a standard tech company interview session from problem statement to working object-oriented code implementation.'
          },
          {
            id: 'LLDP5-013',
            name: '60-Minute Comprehensive LLD Interview Session',
            description: 'Tackle a complex system design problem with deep edge-case handling, concurrency considerations, and full code implementation.'
          },
          {
            id: 'LLDP5-014',
            name: 'Beginner Mock LLD Interview',
            description: 'Complete a full mock interview on a beginner-tier problem (e.g. Vending Machine) with self-assessment against an evaluation rubric.'
          },
          {
            id: 'LLDP5-015',
            name: 'Intermediate Mock LLD Interview',
            description: 'Complete a full mock interview on an intermediate-tier problem (e.g. Parking Lot or Elevator) with rigorous trade-off defense.'
          },
          {
            id: 'LLDP5-016',
            name: 'Advanced Full LLD Mock Interview',
            description: 'Complete a full mock interview on an advanced-tier problem (e.g. Splitwise or BookMyShow) with dynamic requirement pivots.'
          },
          {
            id: 'LLDP5-017',
            name: 'Final Assessment & Readiness Evaluation',
            description: 'Evaluate your end-to-end LLD readiness across code quality, pattern application, interview communication, and timing.'
          }
        ]
      },
      {
        id: 'LLDP5-P4',
        name: 'Final Revision Framework',
        description: 'Rapid revision tracks to review foundational concepts, design patterns, and classic problem architectures right before interviews.',
        children: [
          {
            id: 'LLDP5-018',
            name: 'Comprehensive Revision: OOP & Design Foundations',
            description: 'Quickly review all core OOP concepts, polymorphism mechanics, interface design, and UML relationship notation.'
          },
          {
            id: 'LLDP5-019',
            name: 'Comprehensive Revision: SOLID & Advanced Principles',
            description: 'Revisit the 5 SOLID principles, clean code metrics, and common code smells with quick real-world examples.'
          },
          {
            id: 'LLDP5-020',
            name: 'Comprehensive Revision: GoF Design Patterns',
            description: 'Review the intent, UML structure, and ideal use cases for all 23 GoF Creational, Structural, and Behavioral design patterns.'
          },
          {
            id: 'LLDP5-021',
            name: 'Comprehensive Revision: Classic LLD Problems',
            description: 'Review class diagrams, key entities, and pattern applications for the top 10 most frequently asked LLD interview problems.'
          }
        ]
      }
    ]
  }
];

async function seedMultiArenaLldCurriculum() {
  console.log("================================================================================");
  console.log("STARTING 5-ARENA LLD CURRICULUM SEEDING (WITH DESCRIPTIONS)");
  console.log("================================================================================");

  const uri = process.env.DB_NAME 
    ? `${process.env.MONGODB_URI}/${process.env.DB_NAME}?authSource=admin` 
    : process.env.MONGODB_URI;

  await mongoose.connect(uri);
  console.log("Connected to MongoDB database.");

  const { Branch } = await import('../models/branch.model.js');
  const { Project } = await import('../models/project.model.js');
  const { Task } = await import('../models/task.model.js');
  const { User } = await import('../models/user.model.js');

  const lldBranchId = new mongoose.Types.ObjectId("6a083a77f7e66b83659e7174");

  // 1. Locate LLD Branch
  let lldBranch = await Branch.findOne({
    $or: [
      { slug: "lld(low-level-design)" },
      { _id: lldBranchId }
    ]
  });

  if (!lldBranch) {
    console.log("Creating LLD Branch...");
    lldBranch = await Branch.create({
      _id: lldBranchId,
      name: "LLD(Low Level Design)",
      slug: "lld(low-level-design)",
      description: "Low Level Design Mastery & Object Oriented Architecture",
      isActive: true,
      visibility: "private"
    });
  }
  console.log(`✓ LLD Branch confirmed: "${lldBranch.name}" (ID: ${lldBranch._id})`);

  // 2. Find Admin User
  const adminUser = await User.findOne({ email: "balajiaadi2000@gmail.com" });
  if (!adminUser) {
    throw new Error("Admin user balajiaadi2000@gmail.com not found!");
  }

  // Ensure Admin has branchAccess to LLD
  const hasLldAccess = (adminUser.branchAccess || []).some(
    a => a.branchId && a.branchId.toString() === lldBranch._id.toString()
  );
  if (!hasLldAccess) {
    adminUser.branchAccess = adminUser.branchAccess || [];
    adminUser.branchAccess.push({ branchId: lldBranch._id, role: "admin" });
    await adminUser.save();
    console.log("✓ Added LLD branchAccess to admin user.");
  }

  // 3. Clean up previously seeded tasks/projects strictly in LLD branch
  const deletedOldTasks = await Task.deleteMany({ branchId: lldBranch._id });
  const deletedOldProjects = await Project.deleteMany({ branchId: lldBranch._id });
  console.log(`Cleaned up previous LLD items: ${deletedOldProjects.deletedCount} projects, ${deletedOldTasks.deletedCount} tasks.`);

  // 4. Seed 5 Arenas and their Parent / Child Tasks
  let totalArenasCreated = 0;
  let totalParentsCreated = 0;
  let totalChildrenCreated = 0;

  for (let aIdx = 0; aIdx < lldArenas.length; aIdx++) {
    const arena = lldArenas[aIdx];

    const projectDoc = await Project.create({
      name: arena.name,
      key: arena.key,
      access: "public",
      description: arena.description,
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      priority: "high",
      status: "active",
      projectManager: adminUser._id,
      teamMembers: [adminUser._id],
      rolesAndResponsibilities: [
        {
          teamMember: adminUser._id,
          role: "Lead",
          responsibility: `Complete ${arena.name}`
        }
      ],
      settings: {
        enableLeetCodeSearch: false,
        enableYoutubeSearch: true,
        sprintDuration: 2,
        enableSprints: false
      },
      branchId: lldBranch._id,
      createdBy: adminUser._id
    });
    totalArenasCreated++;
    console.log(`\n🏟️  Created Arena [${arena.key}]: "${arena.name}" (ID: ${projectDoc._id})`);

    for (let pIdx = 0; pIdx < arena.parents.length; pIdx++) {
      const parent = arena.parents[pIdx];
      const childCount = parent.children.length;

      const parentDoc = await Task.create({
        projectName: projectDoc._id,
        taskName: parent.name,
        taskId: parent.id,
        taskDescription: parent.description,
        taskPriority: "high",
        taskType: "preparation",
        taskStartDate: null,
        taskDueDate: null,
        estimatedHours: childCount * 2,
        storyPoints: 0,
        progress: 0,
        status: "todo",
        parentTask: null,
        assignee: adminUser._id,
        createdBy: adminUser._id,
        branchId: lldBranch._id,
        subtaskStats: {
          total: childCount,
          completed: 0
        },
        activityLogs: [
          {
            oldStatus: null,
            currentStatus: "",
            user: adminUser._id,
            date: new Date(),
            message: "Task created with status Todo"
          }
        ]
      });
      totalParentsCreated++;
      console.log(`   📂 Parent ${parent.id}: "${parent.name}" (${childCount} tasks)`);

      for (let cIdx = 0; cIdx < parent.children.length; cIdx++) {
        const child = parent.children[cIdx];
        await Task.create({
          projectName: projectDoc._id,
          taskName: child.name,
          taskId: child.id,
          taskDescription: child.description,
          taskPriority: "medium",
          taskType: "Preparation",
          taskStartDate: null,
          taskDueDate: null,
          estimatedHours: 2,
          storyPoints: 0,
          progress: 0,
          status: "todo",
          parentTask: parentDoc._id,
          assignee: adminUser._id,
          createdBy: adminUser._id,
          branchId: lldBranch._id,
          subtaskStats: {
            total: 0,
            completed: 0
          },
          activityLogs: [
            {
              oldStatus: null,
              currentStatus: "",
              user: adminUser._id,
              date: new Date(),
              message: "Task created with status Todo"
            }
          ]
        });
        totalChildrenCreated++;
      }
    }
  }

  await mongoose.disconnect();
  console.log("\n================================================================================");
  console.log(`🎉 5-ARENA LLD CURRICULUM SEEDING COMPLETE!`);
  console.log(`   Arenas Created: ${totalArenasCreated}`);
  console.log(`   Parent Topics Created: ${totalParentsCreated} (all with learning-oriented descriptions)`);
  console.log(`   Total Child Tasks Seeded: ${totalChildrenCreated} (all with learning-oriented descriptions)`);
  console.log(`   Dates: Set to null (Ready for Schedule Arena flexible setup per Phase)`);
  console.log("================================================================================");
}

seedMultiArenaLldCurriculum().catch(err => {
  console.error("❌ Seeding Error:", err);
  process.exit(1);
});
