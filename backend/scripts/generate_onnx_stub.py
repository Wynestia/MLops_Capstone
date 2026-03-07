from pathlib import Path

import numpy as np
import onnx
from onnx import TensorProto, helper, numpy_helper


def build_model() -> onnx.ModelProto:
    """
    Build a tiny CNN-style ONNX graph for emotion logits.
    Input : [1, 3, 224, 224]
    Output: [1, 4]  (Happy, Relaxed, Sad, Angry logits)
    """
    np.random.seed(42)

    w = np.array(
        [
            [1.20, -0.70, 0.10],   # Happy
            [0.20, 0.90, -0.40],   # Relaxed
            [-1.10, 0.30, 0.80],   # Sad
            [-0.60, -0.20, 1.10],  # Angry
        ],
        dtype=np.float32,
    ).T  # shape [3,4] for Gemm
    b = np.array([0.15, 0.10, -0.05, -0.10], dtype=np.float32)

    w_init = numpy_helper.from_array(w, name="W")
    b_init = numpy_helper.from_array(b, name="B")

    nodes = [
        helper.make_node("GlobalAveragePool", ["input"], ["gap"]),
        helper.make_node("Flatten", ["gap"], ["flat"], axis=1),
        helper.make_node("Gemm", ["flat", "W", "B"], ["logits"], alpha=1.0, beta=1.0, transB=0),
    ]

    graph = helper.make_graph(
        nodes=nodes,
        name="dog_emotion_stub",
        inputs=[helper.make_tensor_value_info("input", TensorProto.FLOAT, [1, 3, 224, 224])],
        outputs=[helper.make_tensor_value_info("logits", TensorProto.FLOAT, [1, 4])],
        initializer=[w_init, b_init],
    )

    model = helper.make_model(
        graph,
        producer_name="pawmind_stub_exporter",
        opset_imports=[helper.make_opsetid("", 13)],
    )
    onnx.checker.check_model(model)
    return model


def main() -> None:
    out = Path(__file__).resolve().parents[1] / "ml" / "model.onnx"
    out.parent.mkdir(parents=True, exist_ok=True)
    model = build_model()
    onnx.save(model, out.as_posix())
    print(f"ONNX model written: {out}")


if __name__ == "__main__":
    main()
