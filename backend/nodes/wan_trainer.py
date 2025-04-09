from typing import Tuple, Union, List
import asyncio

from node_utils import Node

from dataclasses import dataclass


@dataclass
class CaptionedImage:
    image: str
    caption: str


@dataclass
class CaptionedVideo:
    video: str
    caption: str


class CaptionedVideoSource(Node):
    async def run(self) -> CaptionedVideo:
        video_upload = self.widgets[0]  # {"type": "video_file_upload", "value": ""}
        caption = self.widgets[1]
        captioned_video = CaptionedVideo(video_upload, caption)
        return captioned_video


class CaptionedImageSource(Node):
    async def run(self) -> CaptionedImage:
        image_upload = self.widgets[0]  # {"type": "image_file_upload", "value": ""}
        caption = self.widgets[1]
        captioned_image = CaptionedImage(image_upload, caption)
        return captioned_image


class SaveCaptionedMedia(Node):
    async def run(
        self,
        captioned_images: Union[CaptionedImage, List[CaptionedImage]] = None,
        captioned_videos: Union[CaptionedVideo, List[CaptionedVideo]] = None,
    ) -> Tuple[str, List[str]]:
        import base64
        import os
        from datetime import datetime
        from io import BytesIO
        from PIL import Image

        # TODO: Handle if nothing is passed to the input

        # Create output directory if it doesn't exist
        base_output_dir = os.path.join("output")
        output_dir = self.widgets[0]
        full_output_dir = os.path.join(base_output_dir, output_dir)

        if not os.path.exists(full_output_dir):
            os.makedirs(full_output_dir)

        saved_paths = []

        # Handle images if present
        if captioned_images is not None:
            images = (
                [captioned_images]
                if isinstance(captioned_images, CaptionedImage)
                else captioned_images
            )

            for idx, img_data in enumerate(images):
                base64_data = img_data.image.split(",")[1]
                image_data = base64.b64decode(base64_data)
                img = Image.open(BytesIO(image_data))

                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"image_{timestamp}_{idx}"

                image_filename = f"{filename}.png"
                output_path = os.path.join(full_output_dir, image_filename)
                img.save(output_path)

                text_filename = f"{filename}.txt"
                text_path = os.path.join(full_output_dir, text_filename)
                with open(text_path, "w") as f:
                    f.write(img_data.caption)

                saved_paths.append(output_path)

        # Handle videos if present
        if captioned_videos is not None:
            videos = (
                [captioned_videos]
                if isinstance(captioned_videos, CaptionedVideo)
                else captioned_videos
            )

            for idx, video_data in enumerate(videos):
                base64_data = video_data.video.split(",")[1]
                video_bytes = base64.b64decode(base64_data)

                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"video_{timestamp}_{idx}"

                video_filename = f"{filename}.mp4"
                video_path = os.path.join(full_output_dir, video_filename)
                with open(video_path, "wb") as f:
                    f.write(video_bytes)

                text_filename = f"{filename}.txt"
                text_path = os.path.join(full_output_dir, text_filename)
                with open(text_path, "w") as f:
                    f.write(video_data.caption)

                saved_paths.append(video_path)

        return full_output_dir, saved_paths


class WanVideoTrainer(Node):
    async def run(self, directory_path: str) -> str:
        config_path = self.widgets[0]
        path_to_wan_video = self.widgets[1]
        create_dataset_toml(config_path, directory_path)
        create_wan_video_toml(
            config_path, directory_path, config_path, model_ckpt_path=path_to_wan_video
        )
        return config_path


def create_dataset_toml(
    output_path: str,
    directory_path: str,
    resolutions: List[int] = [256],
    min_ar: float = 0.5,
    max_ar: float = 2.0,
    num_ar_buckets: int = 7,
    frame_buckets: List[int] = [1, 33],
    num_repeats: int = 5,
) -> str:
    """
    Creates a dataset.toml file for training configuration.

    Args:
        output_path: Path where to save the TOML file
        directory_path: Path to the input directory
        resolutions: List of resolution values
        min_ar: Minimum aspect ratio
        max_ar: Maximum aspect ratio
        num_ar_buckets: Number of aspect ratio buckets
        frame_buckets: List of frame bucket values
        num_repeats: Number of repeats for directory

    Returns:
        str: Path to the created TOML file
    """
    import toml
    import os

    dataset_config = {
        "resolutions": resolutions,
        "min_ar": min_ar,
        "max_ar": max_ar,
        "num_ar_buckets": num_ar_buckets,
        "frame_buckets": frame_buckets,
        "directory": {"path": directory_path, "num_repeats": num_repeats},
    }

    # Ensure the output directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    # Write the TOML file
    with open(output_path, "w") as f:
        toml.dump(dataset_config, f)

    return output_path


def create_wan_video_toml(
    output_path: str,
    output_dir: str,
    dataset_path: str,
    epochs: int = 100,
    micro_batch_size: int = 1,
    pipeline_stages: int = 1,
    gradient_accumulation_steps: int = 4,
    gradient_clipping: float = 1.0,
    warmup_steps: int = 100,
    eval_every_n_epochs: int = 1,
    save_every_n_epochs: int = 5,
    checkpoint_every_n_minutes: int = 30,
    model_ckpt_path: str = "/path/to/Wan2.1-T2V-14B-480P",
    learning_rate: float = 2e-5,
    weight_decay: float = 0.01,
) -> str:
    """
    Creates a wan_video.toml file for training configuration.

    Args:
        output_path: Path where to save the TOML file
        output_dir: Directory for output files
        dataset_path: Path to the dataset.toml file
        epochs: Number of training epochs
        micro_batch_size: Micro batch size per GPU
        pipeline_stages: Number of pipeline stages
        gradient_accumulation_steps: Number of gradient accumulation steps
        gradient_clipping: Gradient clipping value
        warmup_steps: Number of warmup steps
        eval_every_n_epochs: Evaluation frequency in epochs
        save_every_n_epochs: Model saving frequency in epochs
        checkpoint_every_n_minutes: Checkpoint saving frequency in minutes
        model_ckpt_path: Path to the model checkpoint
        learning_rate: Learning rate for training
        weight_decay: Weight decay for optimizer

    Returns:
        str: Path to the created TOML file
    """
    import toml
    import os

    config = {
        "output_dir": output_dir,
        "dataset": dataset_path,
        "epochs": epochs,
        "micro_batch_size_per_gpu": micro_batch_size,
        "pipeline_stages": pipeline_stages,
        "gradient_accumulation_steps": gradient_accumulation_steps,
        "gradient_clipping": gradient_clipping,
        "warmup_steps": warmup_steps,
        "eval_every_n_epochs": eval_every_n_epochs,
        "eval_before_first_step": True,
        "eval_micro_batch_size_per_gpu": micro_batch_size,
        "eval_gradient_accumulation_steps": 1,
        "save_every_n_epochs": save_every_n_epochs,
        "checkpoint_every_n_minutes": checkpoint_every_n_minutes,
        "activation_checkpointing": True,
        "partition_method": "parameters",
        "save_dtype": "bfloat16",
        "caching_batch_size": 1,
        "steps_per_print": 1,
        "video_clip_mode": "single_middle",
        "model": {
            "type": "wan",
            "ckpt_path": model_ckpt_path,
            "dtype": "bfloat16",
            "transformer_dtype": "float8",
            "timestep_sample_method": "logit_normal",
        },
        "adapter": {"type": "lora", "rank": 32, "dtype": "bfloat16"},
        "optimizer": {
            "type": "adamw_optimi",
            "lr": learning_rate,
            "betas": [0.9, 0.99],
            "weight_decay": weight_decay,
            "eps": 1e-8,
        },
    }

    # Ensure the output directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    # Write the TOML file
    with open(output_path, "w") as f:
        toml.dump(config, f)

    return output_path
