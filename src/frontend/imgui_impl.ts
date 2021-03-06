import * as ImGui from "../lib/imgui-js/imgui";

let clipboard_text: string = "";

let canvas: HTMLCanvasElement | null = null;

export let gl: WebGLRenderingContext | null = null;
let g_ShaderHandle: WebGLProgram | null = null;
let g_VertHandle: WebGLShader | null = null;
let g_FragHandle: WebGLShader | null = null;
let g_AttribLocationTex: WebGLUniformLocation | null = null;
let g_AttribLocationProjMtx: WebGLUniformLocation | null = null;
let g_AttribLocationPosition: GLint = -1;
let g_AttribLocationUV: GLint = -1;
let g_AttribLocationColor: GLint = -1;
let g_VboHandle: WebGLBuffer | null = null;
let g_ElementsHandle: WebGLBuffer | null = null;
let g_FontTexture: WebGLTexture | null = null;

let prev_time: number = 0;

function document_on_copy(event: ClipboardEvent): void {
    if (event.clipboardData) {
        event.clipboardData.setData("text/plain", clipboard_text);
    }
    // console.log(`${event.type}: "${clipboard_text}"`);
    event.preventDefault();
}

function document_on_cut(event: ClipboardEvent): void {
    if (event.clipboardData) {
        event.clipboardData.setData("text/plain", clipboard_text);
    }
    // console.log(`${event.type}: "${clipboard_text}"`);
    event.preventDefault();
}

function document_on_paste(event: ClipboardEvent): void {
    if (event.clipboardData) {
        clipboard_text = event.clipboardData.getData("text/plain");
    }
    // console.log(`${event.type}: "${clipboard_text}"`);
    event.preventDefault();
}

export function WindowOnResize(): void {
    if (canvas !== null) {
        const devicePixelRatio: number = window.devicePixelRatio || 1;
        canvas.width = Math.floor(canvas.scrollWidth * devicePixelRatio);
        canvas.height = Math.floor(canvas.scrollHeight * devicePixelRatio);
    }
}

function window_on_gamepadconnected(event: any /* GamepadEvent */): void {
    console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
        event.gamepad.index, event.gamepad.id,
        event.gamepad.buttons.length, event.gamepad.axes.length);
}

function window_on_gamepaddisconnected(event: any /* GamepadEvent */): void {
    console.log("Gamepad disconnected at index %d: %s.",
        event.gamepad.index, event.gamepad.id);
}

function canvas_on_blur(event: FocusEvent): void {
    const io = ImGui.GetIO();
    io.KeyCtrl = false;
    io.KeyShift = false;
    io.KeyAlt = false;
    io.KeySuper = false;
    for (let i = 0; i < io.KeysDown.length; ++i) {
        io.KeysDown[i] = false;
    }
    for (let i = 0; i < io.MouseDown.length; ++i) {
        io.MouseDown[i] = false;
    }
}

function canvas_on_keydown(event: KeyboardEvent): void {
    // console.log(event.type, event.key, event.keyCode);
    const io = ImGui.GetIO();
    io.KeyCtrl = event.ctrlKey;
    io.KeyShift = event.shiftKey;
    io.KeyAlt = event.altKey;
    io.KeySuper = event.metaKey;
    ImGui.IM_ASSERT(event.keyCode >= 0 && event.keyCode < ImGui.IM_ARRAYSIZE(io.KeysDown));
    io.KeysDown[event.keyCode] = true;
    // forward to the keypress event
    if (/*io.WantCaptureKeyboard ||*/ event.key === "Tab") {
        event.preventDefault();
    }
}

function canvas_on_keyup(event: KeyboardEvent): void {
    // console.log(event.type, event.key, event.keyCode);
    const io = ImGui.GetIO();
    io.KeyCtrl = event.ctrlKey;
    io.KeyShift = event.shiftKey;
    io.KeyAlt = event.altKey;
    io.KeySuper = event.metaKey;
    ImGui.IM_ASSERT(event.keyCode >= 0 && event.keyCode < ImGui.IM_ARRAYSIZE(io.KeysDown));
    io.KeysDown[event.keyCode] = false;
    if (io.WantCaptureKeyboard) {
        event.preventDefault();
    }
}

function canvas_on_keypress(event: KeyboardEvent): void {
    // console.log(event.type, event.key, event.keyCode);
    const io = ImGui.GetIO();
    io.AddInputCharacter(event.charCode);
    if (io.WantCaptureKeyboard) {
        event.preventDefault();
    }
}

function canvas_on_pointermove(event: PointerEvent): void {
    const io = ImGui.GetIO();
    io.MousePos.x = event.offsetX;
    io.MousePos.y = event.offsetY;
    if (io.WantCaptureMouse) {
        event.preventDefault();
    }
}

// MouseEvent.button
// A number representing a given button:
// 0: Main button pressed, usually the left button or the un-initialized state
// 1: Auxiliary button pressed, usually the wheel button or the middle button (if present)
// 2: Secondary button pressed, usually the right button
// 3: Fourth button, typically the Browser Back button
// 4: Fifth button, typically the Browser Forward button
const mouse_button_map: number[] = [0, 2, 1, 3, 4];

function canvas_on_pointerdown(event: PointerEvent): void {
    const io = ImGui.GetIO();
    io.MousePos.x = event.offsetX;
    io.MousePos.y = event.offsetY;
    io.MouseDown[mouse_button_map[event.button]] = true;
    // if (io.WantCaptureMouse) {
    //     event.preventDefault();
    // }
}
function canvas_on_contextmenu(event: Event): void {
    const io = ImGui.GetIO();
    if (io.WantCaptureMouse) {
        event.preventDefault();
    }
}

function canvas_on_pointerup(event: PointerEvent): void {
    const io = ImGui.GetIO();
    io.MouseDown[mouse_button_map[event.button]] = false;
    if (io.WantCaptureMouse) {
        event.preventDefault();
    }
}

function canvas_on_wheel(event: WheelEvent): void {
    const io = ImGui.GetIO();
    let scale: number = 1.0;
    switch (event.deltaMode) {
        case event.DOM_DELTA_PIXEL: scale = 0.01; break;
        case event.DOM_DELTA_LINE: scale = 0.2; break;
        case event.DOM_DELTA_PAGE: scale = 1.0; break;
    }
    io.MouseWheelH = event.deltaX * scale;
    io.MouseWheel = -event.deltaY * scale; // Mouse wheel: 1 unit scrolls about 5 lines text.
    if (io.WantCaptureMouse) {
        event.preventDefault();
    }
}

export function Init(value: HTMLCanvasElement | WebGLRenderingContext | CanvasRenderingContext2D | null): void {
    const io = ImGui.GetIO();

    if (typeof (window) !== "undefined") {
        io.BackendPlatformName = "imgui_impl_html5";
        ImGui.LoadIniSettingsFromMemory(window.localStorage.getItem("imgui.ini") || "");
    }

    if (typeof (navigator) !== "undefined") {
        io.ConfigMacOSXBehaviors = navigator.platform.match(/Mac/) !== null;
    }

    if (typeof (document) !== "undefined") {
        document.body.addEventListener("copy", document_on_copy);
        document.body.addEventListener("cut", document_on_cut);
        document.body.addEventListener("paste", document_on_paste);
    }

    io.SetClipboardTextFn = (user_data: any, text: string): void => {
        clipboard_text = text;
        // console.log(`set clipboard_text: "${clipboard_text}"`);
        if (typeof navigator !== "undefined" && typeof (navigator as any).clipboard !== "undefined") {
            // console.log(`clipboard.writeText: "${clipboard_text}"`);
            (navigator as any).clipboard.writeText(clipboard_text).then((): void => {
                // console.log(`clipboard.writeText: "${clipboard_text}" done.`);
            });
        }
    };
    io.GetClipboardTextFn = (user_data: any): string => {
        // if (typeof navigator !== "undefined" && typeof (navigator as any).clipboard !== "undefined") {
        //     console.log(`clipboard.readText: "${clipboard_text}"`);
        //     (navigator as any).clipboard.readText().then((text: string): void => {
        //         clipboard_text = text;
        //         console.log(`clipboard.readText: "${clipboard_text}" done.`);
        //     });
        // }
        // console.log(`get clipboard_text: "${clipboard_text}"`);
        return clipboard_text;
    };
    io.ClipboardUserData = null;

    if (typeof (window) !== "undefined") {
        window.addEventListener("resize", WindowOnResize);
        window.addEventListener("gamepadconnected", window_on_gamepadconnected);
        window.addEventListener("gamepaddisconnected", window_on_gamepaddisconnected);
    }

    if (typeof (window) !== "undefined") {
        if (value instanceof (HTMLCanvasElement)) {
            value = value.getContext("webgl", { alpha: false, antialias: false }) || value.getContext("2d");
        }
        if (value instanceof (WebGLRenderingContext)) {
            io.BackendRendererName = "imgui_impl_webgl";
            canvas = value.canvas as HTMLCanvasElement;
            gl = value;
        }
        if (value instanceof (CanvasRenderingContext2D)) {
            io.BackendRendererName = "imgui_impl_ctx2d";
            canvas = value.canvas;
        }
    }

    if (canvas !== null) {
        WindowOnResize();
        canvas.style.touchAction = "none"; // Disable browser handling of all panning and zooming gestures.
        canvas.addEventListener("blur", canvas_on_blur);
        canvas.addEventListener("keydown", canvas_on_keydown);
        canvas.addEventListener("keyup", canvas_on_keyup);
        canvas.addEventListener("keypress", canvas_on_keypress);
        canvas.addEventListener("pointermove", canvas_on_pointermove);
        canvas.addEventListener("pointerdown", canvas_on_pointerdown);
        canvas.addEventListener("contextmenu", canvas_on_contextmenu);
        canvas.addEventListener("pointerup", canvas_on_pointerup);
        canvas.addEventListener("wheel", canvas_on_wheel);
    }

    // Setup back-end capabilities flags
    io.BackendFlags |= ImGui.BackendFlags.HasMouseCursors;   // We can honor GetMouseCursor() values (optional)

    // Keyboard mapping. ImGui will use those indices to peek into the io.KeyDown[] array.
    io.KeyMap[ImGui.Key.Tab] = 9;
    io.KeyMap[ImGui.Key.LeftArrow] = 37;
    io.KeyMap[ImGui.Key.RightArrow] = 39;
    io.KeyMap[ImGui.Key.UpArrow] = 38;
    io.KeyMap[ImGui.Key.DownArrow] = 40;
    io.KeyMap[ImGui.Key.PageUp] = 33;
    io.KeyMap[ImGui.Key.PageDown] = 34;
    io.KeyMap[ImGui.Key.Home] = 36;
    io.KeyMap[ImGui.Key.End] = 35;
    io.KeyMap[ImGui.Key.Insert] = 45;
    io.KeyMap[ImGui.Key.Delete] = 46;
    io.KeyMap[ImGui.Key.Backspace] = 8;
    io.KeyMap[ImGui.Key.Space] = 32;
    io.KeyMap[ImGui.Key.Enter] = 13;
    io.KeyMap[ImGui.Key.Escape] = 27;
    io.KeyMap[ImGui.Key.A] = 65;
    io.KeyMap[ImGui.Key.C] = 67;
    io.KeyMap[ImGui.Key.V] = 86;
    io.KeyMap[ImGui.Key.X] = 88;
    io.KeyMap[ImGui.Key.Y] = 89;
    io.KeyMap[ImGui.Key.Z] = 90;

    CreateDeviceObjects();
}

export function Shutdown(): void {
    DestroyDeviceObjects();

    if (canvas !== null) {
        canvas.removeEventListener("blur", canvas_on_blur);
        canvas.removeEventListener("keydown", canvas_on_keydown);
        canvas.removeEventListener("keyup", canvas_on_keyup);
        canvas.removeEventListener("keypress", canvas_on_keypress);
        canvas.removeEventListener("pointermove", canvas_on_pointermove);
        canvas.removeEventListener("pointerdown", canvas_on_pointerdown);
        canvas.removeEventListener("contextmenu", canvas_on_contextmenu);
        canvas.removeEventListener("pointerup", canvas_on_pointerup);
        canvas.removeEventListener("wheel", canvas_on_wheel);
    }

    gl = null;
    canvas = null;

    if (typeof (window) !== "undefined") {
        window.removeEventListener("resize", WindowOnResize);
        window.removeEventListener("gamepadconnected", window_on_gamepadconnected);
        window.removeEventListener("gamepaddisconnected", window_on_gamepaddisconnected);
    }

    if (typeof (document) !== "undefined") {
        document.body.removeEventListener("copy", document_on_copy);
        document.body.removeEventListener("cut", document_on_cut);
        document.body.removeEventListener("paste", document_on_paste);
    }
}

export function NewFrame(time: number): void {
    const io = ImGui.GetIO();

    if (io.WantSaveIniSettings) {
        io.WantSaveIniSettings = false;
        if (typeof (window) !== "undefined") {
            window.localStorage.setItem("imgui.ini", ImGui.SaveIniSettingsToMemory());
        }
    }

    const w: number = canvas && canvas.scrollWidth || 640;
    const h: number = canvas && canvas.scrollHeight || 480;
    const display_w: number = gl && gl.drawingBufferWidth || w;
    const display_h: number = gl && gl.drawingBufferHeight || h;
    io.DisplaySize.x = w;
    io.DisplaySize.y = h;
    io.DisplayFramebufferScale.x = w > 0 ? (display_w / w) : 0;
    io.DisplayFramebufferScale.y = h > 0 ? (display_h / h) : 0;

    const dt: number = time - prev_time;
    prev_time = time;
    io.DeltaTime = dt / 1000;

    if (io.WantSetMousePos) {
        console.log("TODO: MousePos", io.MousePos.x, io.MousePos.y);
    }

    if (typeof (document) !== "undefined") {
        if (io.MouseDrawCursor) {
            document.body.style.cursor = "none";
        } else {
            switch (ImGui.GetMouseCursor()) {
                case ImGui.MouseCursor.None: document.body.style.cursor = "none"; break;
                default: case ImGui.MouseCursor.Arrow: document.body.style.cursor = "default"; break;
                case ImGui.MouseCursor.TextInput: document.body.style.cursor = "text"; break;         // When hovering over InputText, etc.
                case ImGui.MouseCursor.ResizeAll: document.body.style.cursor = "move"; break;         // Unused
                case ImGui.MouseCursor.ResizeNS: document.body.style.cursor = "ns-resize"; break;     // When hovering over an horizontal border
                case ImGui.MouseCursor.ResizeEW: document.body.style.cursor = "ew-resize"; break;     // When hovering over a vertical border or a column
                case ImGui.MouseCursor.ResizeNESW: document.body.style.cursor = "nesw-resize"; break; // When hovering over the bottom-left corner of a window
                case ImGui.MouseCursor.ResizeNWSE: document.body.style.cursor = "nwse-resize"; break; // When hovering over the bottom-right corner of a window
                case ImGui.MouseCursor.Hand: document.body.style.cursor = "move"; break;
            }
        }
    }

    {
        /*     // Gamepad navigation mapping [BETA]
            for (let i = 0; i < io.NavInputs.length; ++i) {
                io.NavInputs[i] = 0.0;
            }
            if (io.ConfigFlags & ImGui.ConfigFlags.NavEnableGamepad) {
                // Update gamepad inputs
                const gamepads: (Gamepad | null)[] = (typeof (navigator) !== "undefined" && typeof (navigator.getGamepads) === "function") ? navigator.getGamepads() : [];
                for (let i = 0; i < gamepads.length; ++i) {
                    const gamepad: Gamepad | null = gamepads[i];
                    if (!gamepad) { continue; }
                    const buttons_count: number = gamepad.buttons.length;
                    const axes_count: number = gamepad.axes.length;
                    function MAP_BUTTON(NAV_NO: number, BUTTON_NO: number): void {
                        if (!gamepad) { return; }
                        if (buttons_count > BUTTON_NO && gamepad.buttons[BUTTON_NO].pressed)
                            io.NavInputs[NAV_NO] = 1.0;
                    }
                    function MAP_ANALOG(NAV_NO: number, AXIS_NO: number, V0: number, V1: number): void {
                        if (!gamepad) { return; }
                        let v: number = (axes_count > AXIS_NO) ? gamepad.axes[AXIS_NO] : V0;
                        v = (v - V0) / (V1 - V0);
                        if (v > 1.0) v = 1.0;
                        if (io.NavInputs[NAV_NO] < v) io.NavInputs[NAV_NO] = v;
                    }
                    // TODO: map input based on vendor and product id
                    // https://developer.mozilla.org/en-US/docs/Web/API/Gamepad/id
                    const match: RegExpMatchArray | null = gamepad.id.match(/^([0-9a-f]{4})-([0-9a-f]{4})-.*$/);
                    const match_chrome: RegExpMatchArray | null = gamepad.id.match(/^.*\(.*Vendor: ([0-9a-f]{4}) Product: ([0-9a-f]{4})\).*$/);
                    const vendor: string = (match && match[1]) || (match_chrome && match_chrome[1]) || "0000";
                    const product: string = (match && match[2]) || (match_chrome && match_chrome[2]) || "0000";
                    switch (vendor + product) {
                        case "046dc216": // Logitech Logitech Dual Action (Vendor: 046d Product: c216)
                            MAP_BUTTON(ImGui.NavInput.Activate, 1); // Cross / A
                            MAP_BUTTON(ImGui.NavInput.Cancel, 2); // Circle / B
                            MAP_BUTTON(ImGui.NavInput.Menu, 0); // Square / X
                            MAP_BUTTON(ImGui.NavInput.Input, 3); // Triangle / Y
                            MAP_ANALOG(ImGui.NavInput.DpadLeft, 4, -0.3, -0.9); // D-Pad Left
                            MAP_ANALOG(ImGui.NavInput.DpadRight, 4, +0.3, +0.9); // D-Pad Right
                            MAP_ANALOG(ImGui.NavInput.DpadUp, 5, -0.3, -0.9); // D-Pad Up
                            MAP_ANALOG(ImGui.NavInput.DpadDown, 5, +0.3, +0.9); // D-Pad Down
                            MAP_BUTTON(ImGui.NavInput.FocusPrev, 4); // L1 / LB
                            MAP_BUTTON(ImGui.NavInput.FocusNext, 5); // R1 / RB
                            MAP_BUTTON(ImGui.NavInput.TweakSlow, 6); // L2 / LT
                            MAP_BUTTON(ImGui.NavInput.TweakFast, 7); // R2 / RT
                            MAP_ANALOG(ImGui.NavInput.LStickLeft, 0, -0.3, -0.9);
                            MAP_ANALOG(ImGui.NavInput.LStickRight, 0, +0.3, +0.9);
                            MAP_ANALOG(ImGui.NavInput.LStickUp, 1, -0.3, -0.9);
                            MAP_ANALOG(ImGui.NavInput.LStickDown, 1, +0.3, +0.9);
                            break;
                        case "046dc21d": // Logitech Gamepad F310 (STANDARD GAMEPAD Vendor: 046d Product: c21d)
                            MAP_BUTTON(ImGui.NavInput.Activate, 0); // Cross / A
                            MAP_BUTTON(ImGui.NavInput.Cancel, 1); // Circle / B
                            MAP_BUTTON(ImGui.NavInput.Menu, 2); // Square / X
                            MAP_BUTTON(ImGui.NavInput.Input, 3); // Triangle / Y
                            MAP_BUTTON(ImGui.NavInput.DpadLeft, 14); // D-Pad Left
                            MAP_BUTTON(ImGui.NavInput.DpadRight, 15); // D-Pad Right
                            MAP_BUTTON(ImGui.NavInput.DpadUp, 12); // D-Pad Up
                            MAP_BUTTON(ImGui.NavInput.DpadDown, 13); // D-Pad Down
                            MAP_BUTTON(ImGui.NavInput.FocusPrev, 4); // L1 / LB
                            MAP_BUTTON(ImGui.NavInput.FocusNext, 5); // R1 / RB
                            MAP_ANALOG(ImGui.NavInput.TweakSlow, 6, +0.3, +0.9); // L2 / LT
                            MAP_ANALOG(ImGui.NavInput.TweakFast, 7, +0.3, +0.9); // R2 / RT
                            MAP_ANALOG(ImGui.NavInput.LStickLeft, 0, -0.3, -0.9);
                            MAP_ANALOG(ImGui.NavInput.LStickRight, 0, +0.3, +0.9);
                            MAP_ANALOG(ImGui.NavInput.LStickUp, 1, -0.3, -0.9);
                            MAP_ANALOG(ImGui.NavInput.LStickDown, 1, +0.3, +0.9);
                            break;
                        case "2dc86001": // 8Bitdo SN30 Pro  8Bitdo SN30 Pro (Vendor: 2dc8 Product: 6001)
                        case "2dc86101": // 8Bitdo SN30 Pro (Vendor: 2dc8 Product: 6101)
                            MAP_BUTTON(ImGui.NavInput.Activate, 1); // Cross / A
                            MAP_BUTTON(ImGui.NavInput.Cancel, 0); // Circle / B
                            MAP_BUTTON(ImGui.NavInput.Menu, 4); // Square / X
                            MAP_BUTTON(ImGui.NavInput.Input, 3); // Triangle / Y
                            MAP_ANALOG(ImGui.NavInput.DpadLeft, 6, -0.3, -0.9); // D-Pad Left
                            MAP_ANALOG(ImGui.NavInput.DpadRight, 6, +0.3, +0.9); // D-Pad Right
                            MAP_ANALOG(ImGui.NavInput.DpadUp, 7, -0.3, -0.9); // D-Pad Up
                            MAP_ANALOG(ImGui.NavInput.DpadDown, 7, +0.3, +0.9); // D-Pad Down
                            MAP_BUTTON(ImGui.NavInput.FocusPrev, 6); // L1 / LB
                            MAP_BUTTON(ImGui.NavInput.FocusNext, 7); // R1 / RB
                            MAP_BUTTON(ImGui.NavInput.TweakSlow, 8); // L2 / LT
                            MAP_BUTTON(ImGui.NavInput.TweakFast, 9); // R2 / RT
                            MAP_ANALOG(ImGui.NavInput.LStickLeft, 0, -0.3, -0.9);
                            MAP_ANALOG(ImGui.NavInput.LStickRight, 0, +0.3, +0.9);
                            MAP_ANALOG(ImGui.NavInput.LStickUp, 1, -0.3, -0.9);
                            MAP_ANALOG(ImGui.NavInput.LStickDown, 1, +0.3, +0.9);
                            break;
                        default: // standard gamepad: https://w3c.github.io/gamepad/#remapping
                            MAP_BUTTON(ImGui.NavInput.Activate, 0); // Cross / A
                            MAP_BUTTON(ImGui.NavInput.Cancel, 1); // Circle / B
                            MAP_BUTTON(ImGui.NavInput.Menu, 2); // Square / X
                            MAP_BUTTON(ImGui.NavInput.Input, 3); // Triangle / Y
                            MAP_BUTTON(ImGui.NavInput.DpadLeft, 14); // D-Pad Left
                            MAP_BUTTON(ImGui.NavInput.DpadRight, 15); // D-Pad Right
                            MAP_BUTTON(ImGui.NavInput.DpadUp, 12); // D-Pad Up
                            MAP_BUTTON(ImGui.NavInput.DpadDown, 13); // D-Pad Down
                            MAP_BUTTON(ImGui.NavInput.FocusPrev, 4); // L1 / LB
                            MAP_BUTTON(ImGui.NavInput.FocusNext, 5); // R1 / RB
                            MAP_BUTTON(ImGui.NavInput.TweakSlow, 6); // L2 / LT
                            MAP_BUTTON(ImGui.NavInput.TweakFast, 7); // R2 / RT
                            MAP_ANALOG(ImGui.NavInput.LStickLeft, 0, -0.3, -0.9);
                            MAP_ANALOG(ImGui.NavInput.LStickRight, 0, +0.3, +0.9);
                            MAP_ANALOG(ImGui.NavInput.LStickUp, 1, -0.3, -0.9);
                            MAP_ANALOG(ImGui.NavInput.LStickDown, 1, +0.3, +0.9);
                            break;
                    }
                }
            } */
    }
}

export function RenderDrawData(draw_data: ImGui.ImDrawData | null = ImGui.GetDrawData()): void {
    const io = ImGui.GetIO();
    if (draw_data === null) { throw new Error(); }

    gl || console.log(draw_data);

    // Avoid rendering when minimized, scale coordinates for retina displays (screen coordinates != framebuffer coordinates)
    const fb_width: number = io.DisplaySize.x * io.DisplayFramebufferScale.x;
    const fb_height: number = io.DisplaySize.y * io.DisplayFramebufferScale.y;
    if (fb_width === 0 || fb_height === 0) {
        return;
    }
    draw_data.ScaleClipRects(io.DisplayFramebufferScale);

    // Instead of running checks every call, just do it once!
    if (gl != null) {
        let gli = gl;
        // NOTE: I commented this out because it was taking up WAY too much CPU time.
        // // Backup GL state
        // const last_active_texture: GLenum | null = gli.getParameter(gli.ACTIVE_TEXTURE) || null;
        // const last_program: WebGLProgram | null = gli.getParameter(gli.CURRENT_PROGRAM) || null;
        // const last_texture: WebGLTexture | null = gli.getParameter(gli.TEXTURE_BINDING_2D) || null;
        // const last_array_buffer: WebGLBuffer | null = gli.getParameter(gli.ARRAY_BUFFER_BINDING) || null;
        // const last_element_array_buffer: WebGLBuffer | null = gli.getParameter(gli.ELEMENT_ARRAY_BUFFER_BINDING) || null;
        // GLint last_polygon_mode[2]; glGetIntegerv(GL_POLYGON_MODE, last_polygon_mode);

        // const last_blend_src_rgb: GLenum | null = gli.getParameter(gli.BLEND_SRC_RGB) || null;
        // const last_blend_dst_rgb: GLenum | null = gli.getParameter(gli.BLEND_DST_RGB) || null;
        // const last_blend_src_alpha: GLenum | null = gli.getParameter(gli.BLEND_SRC_ALPHA) || null;
        // const last_blend_dst_alpha: GLenum | null = gli.getParameter(gli.BLEND_DST_ALPHA) || null;
        // const last_blend_equation_rgb: GLenum | null = gli.getParameter(gli.BLEND_EQUATION_RGB) || null;
        // const last_blend_equation_alpha: GLenum | null = gli.getParameter(gli.BLEND_EQUATION_ALPHA) || null;
        // const last_enable_blend: GLboolean | null = gli.getParameter(gli.BLEND) || null;
        // const last_enable_cull_face: GLboolean | null = gli.getParameter(gli.CULL_FACE) || null;
        // const last_enable_depth_test: GLboolean | null = gli.getParameter(gli.DEPTH_TEST) || null;
        // const last_enable_scissor_test: GLboolean | null = gli.getParameter(gli.SCISSOR_TEST) || null;
        // const last_viewport: Int32Array | null = gli.getParameter(gli.VIEWPORT) || null;
        // const last_scissor_box: Int32Array | null = gli.getParameter(gli.SCISSOR_BOX) || null;

        // Setup render state: alpha-blending enabled, no face culling, no depth testing, scissor enabled, polygon fill
        gli.enable(gli.BLEND);
        gli.blendEquation(gli.FUNC_ADD);
        gli.blendFunc(gli.SRC_ALPHA, gli.ONE_MINUS_SRC_ALPHA);
        gli.disable(gli.CULL_FACE);
        gli.disable(gli.DEPTH_TEST);
        gli.enable(gli.SCISSOR_TEST);
        // glPolygonMode(GL_FRONT_AND_BACK, GL_FILL);

        // Setup viewport, orthographic projection matrix
        // Our visible imgui space lies from draw_data->DisplayPps (top left) to draw_data->DisplayPos+data_data->DisplaySize (bottom right). DisplayMin is typically (0,0) for single viewport apps.
        gli.viewport(0, 0, fb_width, fb_height);
        const L: number = draw_data.DisplayPos.x;
        const R: number = draw_data.DisplayPos.x + draw_data.DisplaySize.x;
        const T: number = draw_data.DisplayPos.y;
        const B: number = draw_data.DisplayPos.y + draw_data.DisplaySize.y;
        const ortho_projection: Float32Array = new Float32Array([
            2.0 / (R - L), 0.0, 0.0, 0.0,
            0.0, 2.0 / (T - B), 0.0, 0.0,
            0.0, 0.0, -1.0, 0.0,
            (R + L) / (L - R), (T + B) / (B - T), 0.0, 1.0,
        ]);
        gli.useProgram(g_ShaderHandle);
        gli.uniform1i(g_AttribLocationTex, 0);
        g_AttribLocationProjMtx && gli.uniformMatrix4fv(g_AttribLocationProjMtx, false, ortho_projection);

        // Render command lists
        gli.bindBuffer(gli.ARRAY_BUFFER, g_VboHandle);
        gli.enableVertexAttribArray(g_AttribLocationPosition);
        gli.enableVertexAttribArray(g_AttribLocationUV);
        gli.enableVertexAttribArray(g_AttribLocationColor);

        gli.vertexAttribPointer(g_AttribLocationPosition, 2, gli.FLOAT, false, ImGui.ImDrawVertSize, ImGui.ImDrawVertPosOffset);
        gli.vertexAttribPointer(g_AttribLocationUV, 2, gli.FLOAT, false, ImGui.ImDrawVertSize, ImGui.ImDrawVertUVOffset);
        gli.vertexAttribPointer(g_AttribLocationColor, 4, gli.UNSIGNED_BYTE, true, ImGui.ImDrawVertSize, ImGui.ImDrawVertColOffset);

        // Draw
        const pos = draw_data.DisplayPos;
        const idx_buffer_type: GLenum = ((ImGui.ImDrawIdxSize === 4) ? gli.UNSIGNED_INT : gli.UNSIGNED_SHORT) || 0;
        draw_data.IterateDrawLists((draw_list: ImGui.ImDrawList): void => {
            // gl || ctx || console.log(draw_list);
            // gl || ctx || console.log("VtxBuffer.length", draw_list.VtxBuffer.length);
            // gl || ctx || console.log("IdxBuffer.length", draw_list.IdxBuffer.length);

            let idx_buffer_offset: number = 0;

            gl && gl.bindBuffer(gl.ARRAY_BUFFER, g_VboHandle);
            gl && gl.bufferData(gl.ARRAY_BUFFER, draw_list.VtxBuffer, gl.STREAM_DRAW);
            gl && gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g_ElementsHandle);
            gl && gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, draw_list.IdxBuffer, gl.STREAM_DRAW);

            draw_list.IterateDrawCmds((draw_cmd: ImGui.ImDrawCmd): void => {
                // gl || ctx || console.log(draw_cmd);
                // gl || ctx || console.log("ElemCount", draw_cmd.ElemCount);
                // gl || ctx || console.log("ClipRect", draw_cmd.ClipRect.x, fb_height - draw_cmd.ClipRect.w, draw_cmd.ClipRect.z - draw_cmd.ClipRect.x, draw_cmd.ClipRect.w - draw_cmd.ClipRect.y);
                // gl || ctx || console.log("TextureId", draw_cmd.TextureId);
                // if (!gl && !ctx) {
                //     console.log("i: pos.x pos.y uv.x uv.y col");
                //     for (let i = 0; i < Math.min(3, draw_cmd.ElemCount); ++i) {
                //         const view: ImGui.ImDrawVert = new ImGui.ImDrawVert(draw_list.VtxBuffer.buffer, draw_list.VtxBuffer.byteOffset + i * ImGui.ImDrawVertSize);
                //         console.log(`${i}: ${view.pos[0].toFixed(2)} ${view.pos[1].toFixed(2)} ${view.uv[0].toFixed(5)} ${view.uv[1].toFixed(5)} ${("00000000" + view.col[0].toString(16)).substr(-8)}`);
                //     }
                // }

                if (draw_cmd.UserCallback !== null) {
                    // User callback (registered via ImDrawList::AddCallback)
                    draw_cmd.UserCallback(draw_list, draw_cmd);
                } else {
                    const clip_rect = new ImGui.ImVec4(draw_cmd.ClipRect.x - pos.x, draw_cmd.ClipRect.y - pos.y, draw_cmd.ClipRect.z - pos.x, draw_cmd.ClipRect.w - pos.y);
                    if (clip_rect.x < fb_width && clip_rect.y < fb_height && clip_rect.z >= 0.0 && clip_rect.w >= 0.0) {
                        // Apply scissor/clipping rectangle
                        gl && gl.scissor(clip_rect.x, fb_height - clip_rect.w, clip_rect.z - clip_rect.x, clip_rect.w - clip_rect.y);

                        // Bind texture, Draw
                        gl && gl.activeTexture(gl.TEXTURE0);
                        gl && gl.bindTexture(gl.TEXTURE_2D, draw_cmd.TextureId);
                        gl && gl.drawElements(gl.TRIANGLES, draw_cmd.ElemCount, idx_buffer_type, idx_buffer_offset);
                    }
                }

                idx_buffer_offset += draw_cmd.ElemCount * ImGui.ImDrawIdxSize;
            });
        });

        // Restore modified GL state
        // (last_program !== null) && gli.useProgram(last_program);
        // (last_texture !== null) && gli.bindTexture(gli.TEXTURE_2D, last_texture);
        // (last_active_texture !== null) && gli.activeTexture(last_active_texture);
        // gli.disableVertexAttribArray(g_AttribLocationPosition);
        // gli.disableVertexAttribArray(g_AttribLocationUV);
        // gli.disableVertexAttribArray(g_AttribLocationColor);
        // (last_array_buffer !== null) && gli.bindBuffer(gli.ARRAY_BUFFER, last_array_buffer);
        // (last_element_array_buffer !== null) && gli.bindBuffer(gli.ELEMENT_ARRAY_BUFFER, last_element_array_buffer);
        // (last_blend_equation_rgb !== null && last_blend_equation_alpha !== null) && gli.blendEquationSeparate(last_blend_equation_rgb, last_blend_equation_alpha);
        // (last_blend_src_rgb !== null && last_blend_src_alpha !== null && last_blend_dst_rgb !== null && last_blend_dst_alpha !== null) && gli.blendFuncSeparate(last_blend_src_rgb, last_blend_src_alpha, last_blend_dst_rgb, last_blend_dst_alpha);
        // (last_enable_blend ? gli.enable(gli.BLEND) : gli.disable(gli.BLEND));
        // (last_enable_cull_face ? gli.enable(gli.CULL_FACE) : gli.disable(gli.CULL_FACE));
        // (last_enable_depth_test ? gli.enable(gli.DEPTH_TEST) : gli.disable(gli.DEPTH_TEST));
        // (last_enable_scissor_test ? gli.enable(gli.SCISSOR_TEST) : gli.disable(gli.SCISSOR_TEST));
        // glPolygonMode(GL_FRONT_AND_BACK, (GLenum)last_polygon_mode[0]);
        // (last_viewport !== null) && gli.viewport(last_viewport[0], last_viewport[1], last_viewport[2], last_viewport[3]);
        // (last_scissor_box !== null) && gli.scissor(last_scissor_box[0], last_scissor_box[1], last_scissor_box[2], last_scissor_box[3]);

        gli.disable(gli.SCISSOR_TEST);
    }
}

export function CreateFontsTexture(): void {
    const io = ImGui.GetIO();

    // Backup GL state
    const last_texture: WebGLTexture | null = gl && gl.getParameter(gl.TEXTURE_BINDING_2D);

    // Build texture atlas
    // const width: number = 256;
    // const height: number = 256;
    // const pixels: Uint8Array = new Uint8Array(4 * width * height).fill(0xff);
    const { width, height, pixels } = io.Fonts.GetTexDataAsRGBA32();   // Load as RGBA 32-bits (75% of the memory is wasted, but default font is so small) because it is more likely to be compatible with user's existing shaders. If your ImTextureId represent a higher-level concept than just a GL texture id, consider calling GetTexDataAsAlpha8() instead to save on GPU memory.
    // console.log(`font texture ${width} x ${height} @ ${pixels.length}`);

    // Upload texture to graphics system
    g_FontTexture = gl && gl.createTexture();
    gl && gl.bindTexture(gl.TEXTURE_2D, g_FontTexture);
    gl && gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl && gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    // gl && gl.pixelStorei(gl.UNPACK_ROW_LENGTH); // WebGL2
    gl && gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    // Store our identifier
    io.Fonts.TexID = g_FontTexture || { foo: "bar" };
    // console.log("font texture id", g_FontTexture);


    // Restore modified GL state
    gl && last_texture && gl.bindTexture(gl.TEXTURE_2D, last_texture);
}

export function DestroyFontsTexture(): void {
    const io = ImGui.GetIO();
    io.Fonts.TexID = null;
    gl && gl.deleteTexture(g_FontTexture); g_FontTexture = null;
}

export function CreateDeviceObjects(): void {
    const vertex_shader: string[] = [
        "uniform mat4 ProjMtx;",
        "attribute vec2 Position;",
        "attribute vec2 UV;",
        "attribute vec4 Color;",
        "varying vec2 Frag_UV;",
        "varying vec4 Frag_Color;",
        "void main() {",
        "	Frag_UV = UV;",
        "	Frag_Color = Color;",
        "	gl_Position = ProjMtx * vec4(Position.xy,0,1);",
        "}",
    ];

    const fragment_shader: string[] = [
        "precision mediump float;", // WebGL requires precision specifiers
        "uniform sampler2D Texture;",
        "varying vec2 Frag_UV;",
        "varying vec4 Frag_Color;",
        "void main() {",
        "	gl_FragColor = Frag_Color * texture2D(Texture, Frag_UV);",
        "}",
    ];

    g_ShaderHandle = gl && gl.createProgram();
    g_VertHandle = gl && gl.createShader(gl.VERTEX_SHADER);
    g_FragHandle = gl && gl.createShader(gl.FRAGMENT_SHADER);
    gl && gl.shaderSource(g_VertHandle as WebGLShader, vertex_shader.join("\n"));
    gl && gl.shaderSource(g_FragHandle as WebGLShader, fragment_shader.join("\n"));
    gl && gl.compileShader(g_VertHandle as WebGLShader);
    gl && gl.compileShader(g_FragHandle as WebGLShader);
    gl && gl.attachShader(g_ShaderHandle as WebGLProgram, g_VertHandle as WebGLShader);
    gl && gl.attachShader(g_ShaderHandle as WebGLProgram, g_FragHandle as WebGLShader);
    gl && gl.linkProgram(g_ShaderHandle as WebGLProgram);

    g_AttribLocationTex = gl && gl.getUniformLocation(g_ShaderHandle as WebGLProgram, "Texture");
    g_AttribLocationProjMtx = gl && gl.getUniformLocation(g_ShaderHandle as WebGLProgram, "ProjMtx");
    g_AttribLocationPosition = gl && gl.getAttribLocation(g_ShaderHandle as WebGLProgram, "Position") || 0;
    g_AttribLocationUV = gl && gl.getAttribLocation(g_ShaderHandle as WebGLProgram, "UV") || 0;
    g_AttribLocationColor = gl && gl.getAttribLocation(g_ShaderHandle as WebGLProgram, "Color") || 0;

    g_VboHandle = gl && gl.createBuffer();
    g_ElementsHandle = gl && gl.createBuffer();

    CreateFontsTexture();
}

export function DestroyDeviceObjects(): void {
    DestroyFontsTexture();

    gl && gl.deleteBuffer(g_VboHandle); g_VboHandle = null;
    gl && gl.deleteBuffer(g_ElementsHandle); g_ElementsHandle = null;

    g_AttribLocationTex = null;
    g_AttribLocationProjMtx = null;
    g_AttribLocationPosition = -1;
    g_AttribLocationUV = -1;
    g_AttribLocationColor = -1;

    gl && gl.deleteProgram(g_ShaderHandle); g_ShaderHandle = null;
    gl && gl.deleteShader(g_VertHandle); g_VertHandle = null;
    gl && gl.deleteShader(g_FragHandle); g_FragHandle = null;
}
