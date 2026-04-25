; ===============================================================================
; N body gravity simulation
; uses Rot to store velocity
; requires N connected objects named Obj<N>
; ===============================================================================

; ==== configuration ============================================================
#DEFINE N     3     ; number of objects
#DEFINE G     0.013 ; gravity strength
#DEFINE RANGE 10    ; range to start the locations at
; ===============================================================================

; ===== utility =================================================================
#DEFINE EPS 0.000000001                    ; tiny value to avoid divide by zero
#DEFINE Vel "Rot"                          ; use #Vel insted of Rot for clarity
#DEFINE FUNCTION "ADD R7 ProgramCounter 1" ; utility for making functions
#DEFINE RETURN "SET ProgramCounter R7"     ; utility for returning from functions
; ===============================================================================

; ==== initial setup ============================================================
#FOR n 0 N ; for each object
  #FOR r 0 2 ; for each prop xyz
    #DEFINE prop "XYZ"[r]   ; map 012 -> XYZ
    #DEFINE range RANGE * 2 ; double the start range

    ; starting position
    RAND R6 #range                ; random 0 to RANGE * 2
    SUB Obj#n.Pos.#prop R6 #RANGE ; random -RANGE to RANGE

    ; starting velocity
    SET Obj#n.#Vel.#prop 0        ; clear velocity
  #END
#END
; ===============================================================================

; ==== update loop ==============================================================
LABEL LOOP
  #FUNCTION
  GOTO apply_gravity ; add gravity to velocity
  #FUNCTION
  GOTO move_objects  ; then move objects with velocity

  SLEEP 0            ; run once per frame
GOTO LOOP
; ===============================================================================

; ==== apply gravity ============================================================
; accumulate object gravity for all other objects
; loop over objects with #a and #b
; use R012 for gravity XYZ calculations
LABEL apply_gravity
  #FOR a 0 N ; for each object
    #FOR b 0 N ; for each other object
      #IF a != b
        ; |d| = sqrt(dx^2 + dy^2 + dz^2 + e)

        #FOR r 0 2 ; for each gravity direction
          #DEFINE prop "XYZ"[r] ; map 012 -> XYZ

          SUB R5 Obj#b.Pos.#prop Obj#a.Pos.#prop ; distance
          MUL R#r R5 R5                          ; squared
        #END

        ADD R6 R0 R1   ; sum X + Y
        ADD R6 R6 R2   ; sum X + Y + Z
        ADD R6 R6 #EPS ; avoid divide by zero
        DIV R6 1 R6    ; inverse square

        #FOR r 0 2 ; for each gravity direction
          #DEFINE prop "XYZ"[r] ; map 012 -> XYZ

          MUL R#r R5 R6                             ; * inverse square
          MUL R#r R#r #G                            ; multiply by gravity
          ADD Obj#a.#Vel.#prop Obj#a.#Vel.#prop R#r ; add to velocity
        #END
      #END
    #END
  #END
  #RETURN
; ===============================================================================

; ==== move objects =============================================================
; move all objects by their velocity
LABEL move_objects
  #FOR n 0 N ; for each object
    ADD Obj#n.Pos.X Obj#n.Pos.X Obj#n.#Vel.X ; add velocity to position
    ADD Obj#n.Pos.Y Obj#n.Pos.Y Obj#n.#Vel.Y
    ADD Obj#n.Pos.Z Obj#n.Pos.Z Obj#n.#Vel.Z
  #END
  #RETURN
; ===============================================================================
