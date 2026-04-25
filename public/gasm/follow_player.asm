#DEFINE speed 2.5

; start check
LABEL start
  SET Player.SelId Player.LocalId ; select local player
  SET Player.SelPart 1            ; select body
  IF Player.Valid loop            ; run loop

  SLEEP 0
GOTO start

; main logic
LABEL loop

  ; xz distance to player
  SUB R0 Player.Pos.X Obj.Pos.X
  SUB R1 Player.Pos.Z Obj.Pos.Z

  ; angle towards player
  ATAN2 Obj.Rot.Y R0 R1

  ; xz movement
  #FOR r 0 1
    #DEFINE ins r == 0 ? "COS" : "SIN" ; alternate COS then SIN
    #ins R#r Obj.Rot.Y                 ; get direction from angle
    MUL R#r R#r #speed                 ; multiply by speed
    MUL R#r R#r DeltaTime              ; and DeltaTime for smoothing
  #END

  ; move Obj
  ADD Obj.Pos.X Obj.Pos.X R1
  ADD Obj.Pos.Z Obj.Pos.Z R0

  SLEEP 0
GOTO start
